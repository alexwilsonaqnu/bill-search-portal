
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Received chat request with", messages.length, "messages and bill text length:", billContent.length);

    // Ensure billContent isn't too large (OpenAI has token limits)
    const truncatedBillContent = billContent.length > 100000 
      ? billContent.substring(0, 100000) + "... [Content truncated due to length]"
      : billContent;

    const systemPrompt = `You are an assistant that helps people understand legislative bills. 
    You will be provided with the text of a bill and should answer questions about its content, 
    implications, and meaning. Be concise, accurate, and helpful. 
    When there's ambiguity or uncertainty, acknowledge it. 
    Base your answers solely on the text of the bill. Here's the bill text:
    
    ${truncatedBillContent}`;

    // Add the system prompt to the beginning of the messages array
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log("Calling OpenAI API with model: gpt-4o-mini");

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: fullMessages,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        
        // Check for specific organization error
        if (errorData?.error?.type === 'invalid_request_error' && 
            errorData?.error?.code === 'invalid_organization') {
          return new Response(
            JSON.stringify({ 
              error: 'Organization validation failed. Your OpenAI API key is valid but may be associated with a different organization.',
              userMessage: 'Unable to connect to AI service. The API key is valid but may have organization restrictions.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
