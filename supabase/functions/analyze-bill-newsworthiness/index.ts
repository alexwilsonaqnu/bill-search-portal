
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../analyze-bill-pass-chance/index.ts";
import { BillAnalysisData } from "./types.ts";
import { buildNewsworthinessPrompt } from "./newsworthinessAnalyzer.ts";
import { analyzeWithOpenAI } from "./openaiService.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { billData }: { billData: BillAnalysisData } = await req.json();
    
    console.log("Analyzing newsworthiness for bill:", billData.title);
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    if (!billData || !billData.title) {
      throw new Error("Invalid bill data provided");
    }

    // Build the analysis prompt
    const prompt = buildNewsworthinessPrompt(billData);
    
    // Get analysis from OpenAI
    const analysis = await analyzeWithOpenAI(prompt, OPENAI_API_KEY);
    
    console.log("Successfully analyzed newsworthiness");
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in analyze-bill-newsworthiness:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      userMessage: "Failed to analyze bill newsworthiness. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
