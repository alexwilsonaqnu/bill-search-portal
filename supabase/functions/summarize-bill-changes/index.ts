
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MAX_TOKENS = 50000; // Lowering from 100k to 50k for better safety margin with API limits

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// More aggressive truncation to ensure we stay well within token limits
function truncateText(text: string, maxTokens: number, isImportant = false): string {
  // A very rough estimation: 1 token ≈ 4 characters for English text
  const estimatedMaxChars = maxTokens * 4;
  
  if (text.length <= estimatedMaxChars) {
    return text;
  }
  
  // Preserve more content for important sections if specified
  const truncationPoint = isImportant ? Math.floor(estimatedMaxChars * 0.9) : estimatedMaxChars;
  
  // If text is too long, truncate it and add a message
  return text.substring(0, truncationPoint) + 
    "\n\n[Note: Text has been truncated due to length constraints. Please refer to the full bill for complete details.]";
}

// Improved content extraction - focus on getting the most relevant parts
function extractSummaryPoints(text: string): string {
  // Extract first 15% of text for high-level details (reduced from 20%)
  const firstPartLength = Math.min(Math.floor(text.length * 0.15), 10000);
  const firstPart = text.substring(0, firstPartLength);
  
  // Get bill sections and important legal language
  const sections: string[] = [];
  const sectionMatches = text.matchAll(/Section\s+\d+[\.\s]+([^\n]+)/gi);
  for (const match of sectionMatches) {
    if (sections.length < 8 && match[0].length < 200) { // Limit number and size of sections
      sections.push(match[0].trim());
    }
  }
  
  // Extract key changes focusing on legislative language
  const changeKeywords = [
    "amend", "add", "change", "delete", "revise", "modify",
    "repeal", "insert", "remove", "substitute", "replace"
  ];
  
  const changeRegexPattern = changeKeywords.map(word => `\\b${word}\\w*\\b`).join('|');
  const changeRegex = new RegExp(`(.{0,80}(${changeRegexPattern}).{0,80})`, 'gi');
  
  const changes: string[] = [];
  const changeMatches = text.matchAll(changeRegex);
  for (const match of changeMatches) {
    if (changes.length < 12 && match[0].length < 200) { // Limit number and size of changes
      changes.push(match[0].trim().replace(/\s+/g, ' '));
    }
  }
  
  // Get key definitions which are often important in bills
  const definitions: string[] = [];
  const definitionMatches = text.matchAll(/["']([^"']{10,100})["']\s+means\s+([^\.]{10,100})\./gi);
  for (const match of definitionMatches) {
    if (definitions.length < 5) {
      definitions.push(match[0].trim());
    }
  }
  
  return [
    "BILL OVERVIEW:",
    firstPart.substring(0, 2000), // Limit the overview size
    
    sections.length > 0 ? "\nKEY SECTIONS:" : "",
    sections.join("\n"),
    
    changes.length > 0 ? "\nKEY CHANGES:" : "",
    changes.join("\n"),
    
    definitions.length > 0 ? "\nKEY DEFINITIONS:" : "",
    definitions.join("\n"),
    
    "\n[Note: This is an automatically extracted summary. Please refer to the full bill text for complete details.]"
  ].filter(section => section.length > 0).join("\n\n");
}

serve(async (req) => {
  console.log("summarize-bill-changes function invoked");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    console.log("Request received with parameters:", JSON.stringify({
      billId: requestData.billId,
      billTitle: requestData.billTitle,
      originalTitle: requestData.originalTitle,
      amendedTitle: requestData.amendedTitle,
      // Don't log the full text contents to avoid cluttering logs
      originalTextLength: requestData.originalText?.length,
      amendedTextLength: requestData.amendedText?.length
    }));

    const { originalTitle, amendedTitle, originalText, amendedText, billId, billTitle } = requestData;

    // Check if we have the necessary data
    if (!originalText || !amendedText) {
      console.error("Missing required data:", {
        hasOriginalText: !!originalText,
        hasAmendedText: !!amendedText
      });
      return new Response(
        JSON.stringify({ error: 'Missing bill text content for comparison' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Summarizing changes for bill ${billId}: ${billTitle}`);
    console.log(`Comparing "${originalTitle}" with "${amendedTitle}"`);

    // Check for OpenAI API key
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

    // Process and limit text to avoid token limit errors more aggressively
    const totalLength = (originalText.length + amendedText.length);
    let processedOriginalText = originalText;
    let processedAmendedText = amendedText;

    console.log(`Original bill text size: ${originalText.length} chars`);
    console.log(`Amended bill text size: ${amendedText.length} chars`);
    console.log(`Total text size: ${totalLength} chars`);

    // Lower threshold for switching to summary mode (from 400k to 200k chars)
    if (totalLength > 200000) {
      console.log(`Bill texts too large (${totalLength} chars), using summarization approach`);
      
      // Extract key parts from each text with more aggressive summarization
      processedOriginalText = extractSummaryPoints(originalText);
      processedAmendedText = extractSummaryPoints(amendedText);
      
      console.log(`Summarized original text: ${processedOriginalText.length} chars`);
      console.log(`Summarized amended text: ${processedAmendedText.length} chars`);
      
      // If still too large, truncate further
      const combinedLength = processedOriginalText.length + processedAmendedText.length;
      if (combinedLength > MAX_TOKENS * 4) {
        console.log(`Summaries still too large (${combinedLength} chars), truncating further`);
        const halfMaxTokens = MAX_TOKENS / 2;
        processedOriginalText = truncateText(processedOriginalText, halfMaxTokens, true);
        processedAmendedText = truncateText(processedAmendedText, halfMaxTokens, true);
        
        console.log(`Final original text: ${processedOriginalText.length} chars`);
        console.log(`Final amended text: ${processedAmendedText.length} chars`);
      }
    } else {
      // Even for smaller texts, do some basic truncation to be safe
      const halfMaxTokens = MAX_TOKENS / 2;
      processedOriginalText = truncateText(processedOriginalText, halfMaxTokens);
      processedAmendedText = truncateText(processedAmendedText, halfMaxTokens);
    }

    // Call OpenAI API to generate a summary of the differences
    try {
      console.log("Calling OpenAI API for summarization");
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
      console.log("Successfully generated summary");

      return new Response(
        JSON.stringify({ summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error(`Error calling OpenAI API: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in summarize-bill-changes function:", error);
    // Return a meaningful error to the client
    return new Response(
      JSON.stringify({ 
        error: error.message || String(error),
        userMessage: "Unable to generate summary due to the size of the bill. We've improved our processing to handle large bills better - please try again."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
