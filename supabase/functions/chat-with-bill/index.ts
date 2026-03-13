
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const apiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, billText } = await req.json();
    
    if (!messages) {
      return new Response(
        JSON.stringify({ error: 'Missing messages parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow empty bill text, but display a message about it
    const billContent = billText || "No bill text available. I can still try to answer general questions.";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Lovable API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Received chat request with", messages.length, "messages and bill text length:", billContent.length);

    // Ensure billContent isn't too large (OpenAI has token limits)
    const truncatedBillContent = billContent.length > 100000 
      ? billContent.substring(0, 100000) + "... [Content truncated due to length]"
      : billContent;

    // Enhanced system prompt for better bill analysis
    const systemPrompt = `You are an expert legislative assistant that helps people understand bills and legislation. 
    You have been provided with the full text of a specific bill and should answer questions about its content, 
    implications, purpose, and meaning.

    When answering questions:
    - Be clear, concise, and helpful
    - Use specific details from the bill text when possible
    - Explain complex legislative language in plain English
    - For "what is this about" questions, provide a comprehensive summary of the bill's main purpose and key provisions
    - For specific questions, cite relevant sections or language from the bill
    - If something is unclear or ambiguous in the bill text, acknowledge this
    - Format your responses with bullet points and clear structure when appropriate
    - Focus on the practical implications and real-world effects of the legislation

    Here is the full text of the bill you should analyze:
    
    ${truncatedBillContent}`;

    // Add the system prompt to the beginning of the messages array
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log("Calling Lovable AI Gateway");

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: fullMessages,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        // Check for specific organization error
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded', userMessage: 'Too many requests. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Payment required', userMessage: 'AI credits exhausted. Please add funds.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Token limit error handling
        if (errorData?.error?.type === 'invalid_request_error' && 
            errorData?.error?.message.includes('maximum context length')) {
          return new Response(
            JSON.stringify({ 
              error: 'Token limit exceeded. The bill text is too large for the AI model.',
              userMessage: 'This bill is too long for the AI to process completely. Try asking about specific sections instead.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // General API error
        return new Response(
          JSON.stringify({ 
            error: errorData.error?.message || 'Error calling OpenAI API',
            userMessage: 'Failed to get response from AI. Please try again later.'
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log("Successfully received response from OpenAI");
      
      return new Response(
        JSON.stringify({ response: data.choices[0].message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("OpenAI API request failed:", error);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API request failed: ${error.message || 'Unknown error'}`,
          userMessage: 'Failed to connect to OpenAI service. Please try again later.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in chat-with-bill function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
        userMessage: 'An unexpected error occurred. Please try again later.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
