
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MAX_TOKENS = 100000; // Safely below the 128k limit, allowing room for the response

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function truncateText(text: string, maxTokens: number): string {
  // A very rough estimation: 1 token ≈ 4 characters for English text
  const estimatedMaxChars = maxTokens * 4;
  
  if (text.length <= estimatedMaxChars) {
    return text;
  }
  
  // If text is too long, truncate it and add a message
  return text.substring(0, estimatedMaxChars) + 
    "\n\n[Note: Text has been truncated due to length constraints. Please refer to the full bill for complete details.]";
}

function extractSummaryPoints(text: string): string {
  // Extract first 20% of text for high-level details
  const firstPart = text.substring(0, Math.floor(text.length * 0.2));
  
  // Look for important sections or headings
  const importantSections = text.match(/Section \d+\.[^\n]+/g) || [];
  
  // Extract parts with "amend", "add", "change", "delete", "revise"
  const changeRegex = /(\w*amend\w*|\w*add\w*|\w*change\w*|\w*delete\w*|\w*revis\w*|\w*modif\w*)/gi;
  const changes = text.match(new RegExp(`.{0,100}${changeRegex.source}.{0,100}`, 'gi')) || [];
  
  return [
    firstPart,
    "\nIMPORTANT SECTIONS:\n" + importantSections.slice(0, 10).join("\n"),
    "\nKEY CHANGES:\n" + changes.slice(0, 20).join("\n\n")
  ].join("\n\n");
}

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

    // Process and limit text to avoid token limit errors
    const totalLength = (originalText.length + amendedText.length);
    let processedOriginalText = originalText;
    let processedAmendedText = amendedText;

    // If combined text is too large, use summaries instead of full text
    if (totalLength > MAX_TOKENS * 4) { // Rough char to token conversion
      console.log(`Bill texts too large (${totalLength} chars), using summarization approach`);
      
      // Extract key parts from each text
      processedOriginalText = extractSummaryPoints(originalText);
      processedAmendedText = extractSummaryPoints(amendedText);
      
      // If still too large, truncate further
      if ((processedOriginalText.length + processedAmendedText.length) > MAX_TOKENS * 4) {
        const halfMaxTokens = MAX_TOKENS / 2;
        processedOriginalText = truncateText(processedOriginalText, halfMaxTokens);
        processedAmendedText = truncateText(processedAmendedText, halfMaxTokens);
      }
    }

    // Call OpenAI API to generate a summary of the differences
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using mini model for better efficiency with large texts
        messages: [
          {
            role: 'system',
            content: `You are a legislative analyst specializing in explaining changes between different versions of bills. 
            Provide a concise but comprehensive summary of the key differences between bill versions, 
            highlighting what was added, removed, or modified. Focus on substantive changes that would matter 
            to lawmakers or constituents. Format your response with clear headings and bullet points.
            Note: You may be working with truncated or summarized versions of the bills, so focus on what you can see.`
          },
          {
            role: 'user',
            content: `Compare the following two versions of bill ${billId} (${billTitle}) and provide a summary of the key changes:

ORIGINAL VERSION (${originalTitle}):
${processedOriginalText}

AMENDED VERSION (${amendedTitle}):
${processedAmendedText}

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
    // Return a meaningful error to the client
    return new Response(
      JSON.stringify({ 
        error: error.message || String(error),
        userMessage: "Unable to generate summary due to the large size of the bill. Try comparing specific sections instead."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
