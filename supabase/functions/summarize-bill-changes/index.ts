
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    // Parse request body
    const { originalTitle, amendedTitle, originalText, amendedText, billId, billTitle } = await req.json();

    // Check if we have the necessary data
    if (!originalText || !amendedText) {
      return new Response(
        JSON.stringify({ error: 'Missing bill text content for comparison' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Summarizing changes for bill ${billId}: ${billTitle}`);
    console.log(`Comparing "${originalTitle}" with "${amendedTitle}"`);

    // If no OpenAI API key, return a mock summary for development
    if (!OPENAI_API_KEY) {
      console.warn("No OpenAI API key found in environment variables, returning mock summary");
      const mockSummary = `
This is a simulated summary of changes between "${originalTitle}" and "${amendedTitle}" for bill ${billId}.

Key changes:
1. Several definitions have been modified in Section 3
2. Requirements for reporting in Section 5 have been expanded
3. Funding allocations in Section 8 have increased by 15%
4. A new Section 12 has been added regarding implementation timeline`;

      return new Response(
        JSON.stringify({ summary: mockSummary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call OpenAI API to generate a summary of the differences
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a legislative analyst specializing in explaining changes between different versions of bills. 
            Provide a concise but comprehensive summary of the key differences between bill versions, 
            highlighting what was added, removed, or modified. Focus on substantive changes that would matter 
            to lawmakers or constituents. Format your response with clear headings and bullet points.`
          },
          {
            role: 'user',
            content: `Compare the following two versions of bill ${billId} (${billTitle}) and provide a summary of the key changes:

ORIGINAL VERSION (${originalTitle}):
${originalText}

AMENDED VERSION (${amendedTitle}):
${amendedText}

Please provide:
1. A brief overview of the most important changes
2. A section-by-section breakdown of significant modifications
3. Any notable additions or deletions of entire sections`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const summary = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in summarize-bill-changes function:", error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
