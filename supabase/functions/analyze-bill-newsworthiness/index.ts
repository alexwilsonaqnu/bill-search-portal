
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { BillAnalysisData } from "./types.ts";
import { buildNewsworthinessPrompt } from "./newsworthinessAnalyzer.ts";
import { analyzeWithOpenAI } from "./openaiService.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("analyze-bill-newsworthiness: Function called");
    
    const { billData }: { billData: BillAnalysisData } = await req.json();
    
    console.log("analyze-bill-newsworthiness: Analyzing newsworthiness for bill:", billData.title);
    
    if (!OPENAI_API_KEY) {
      console.error("analyze-bill-newsworthiness: OpenAI API key not configured");
      throw new Error("OpenAI API key not configured");
    }

    if (!billData || !billData.title) {
      console.error("analyze-bill-newsworthiness: Invalid bill data provided");
      throw new Error("Invalid bill data provided");
    }

    // Build the analysis prompt
    const prompt = buildNewsworthinessPrompt(billData);
    console.log("analyze-bill-newsworthiness: Built prompt for analysis");
    
    // Get analysis from OpenAI
    const analysis = await analyzeWithOpenAI(prompt, OPENAI_API_KEY);
    
    console.log("analyze-bill-newsworthiness: Successfully analyzed newsworthiness:", analysis);
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("analyze-bill-newsworthiness: Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      userMessage: "Failed to analyze bill newsworthiness. Please try again later."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
