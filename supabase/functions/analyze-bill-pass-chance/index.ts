
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { BillAnalysisData, PassChanceAnalysis } from "./types.ts";
import { checkRulesReferral, buildAnalysisPrompt } from "./billAnalyzer.ts";
import { analyzeWithOpenAI, createFallbackAnalysis } from "./openaiService.ts";

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
    const { billData } = await req.json();
    
    if (!billData) {
      return new Response(
        JSON.stringify({ error: 'Missing billData parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Analyzing pass chance for bill:", billData.title || billData.id);
    console.log("Sponsor data received:", JSON.stringify(billData.sponsor));
    console.log("Cosponsor count:", billData.cosponsorCount || 0);
    console.log("Changes count:", billData.changesCount || 0);
    console.log("Committee actions count:", billData.committeeActions?.length || 0);
    console.log("Passed both houses:", billData.passedBothHouses);

    // Check for rules committee re-referral with enhanced detection
    const rulesReferralStatus = checkRulesReferral(billData.changes || []);
    console.log("Rules committee re-referral detected:", rulesReferralStatus.hasRulesReferral);
    if (rulesReferralStatus.hasRulesReferral) {
      console.log("Days since rules referral:", rulesReferralStatus.daysSinceReferral);
    }

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(billData as BillAnalysisData, rulesReferralStatus);

    try {
      const analysisResult = await analyzeWithOpenAI(analysisPrompt, openAIApiKey);
      console.log("Successfully parsed analysis result:", analysisResult);
      
      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to parse AI response, using fallback:', error);
      const fallbackResult = createFallbackAnalysis(billData as BillAnalysisData, rulesReferralStatus);
      
      return new Response(
        JSON.stringify(fallbackResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in analyze-bill-pass-chance function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
        userMessage: 'An unexpected error occurred. Please try again later.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
