
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

    // Check for rules committee re-referral
    const rulesReferralStatus = checkRulesReferral(billData.changes || []);
    console.log("Rules committee re-referral detected:", rulesReferralStatus.hasRulesReferral);

    // Build analysis prompt with comprehensive bill metadata
    const sponsorDescription = billData.sponsor 
      ? `${billData.sponsor.name} (${billData.sponsor.party || 'Unknown Party'}, ${billData.sponsor.role || 'Unknown Role'}, District: ${billData.sponsor.district || 'Unknown'})`
      : 'No primary sponsor identified';

    const cosponsorDescription = billData.cosponsorCount > 0 
      ? `${billData.cosponsorCount} cosponsors from various parties and chambers`
      : 'No cosponsors identified';

    // Calculate time since introduction
    const timeAnalysis = calculateTimeAnalysis(billData.introducedDate, billData.lastActionDate);

    // Special handling for bills that passed both houses
    const passedBothHousesNote = billData.passedBothHouses 
      ? "CRITICAL: This bill has PASSED BOTH HOUSES and is awaiting governor approval. Historically, over 95% of bills that pass both houses are signed by the governor. This should result in a score of 4 or 5."
      : "";

    // Rules committee re-referral warning
    const rulesReferralNote = rulesReferralStatus.hasRulesReferral
      ? `MAJOR CONCERN: This bill has been re-referred to the Rules Committee, which is typically a significant indicator of stagnation and political difficulties. Rules committee re-referrals often signal that a bill is being shelved or killed. This should significantly lower the pass chance score (reduce by 1-2 points unless other very strong positive factors exist).`
      : "";

    const analysisPrompt = `
You are analyzing the likelihood that a legislative bill will pass. Based on the bill metadata provided, give a score from 1-5 where 1 is very unlikely to pass and 5 is extremely likely to pass.

${passedBothHousesNote}

${rulesReferralNote}

Consider these factors:
- Who is the primary sponsor of the bill and how influential are they?
- How many cosponsors? The more the better, the more bipartisan sponsors the better.
- How long has it been since the bill was introduced? The longer without action, the less likely it is to pass.
- How many changes has it had? More recent changes means there's movement in the bill, which is good.
- How many committees has it gone through (and been approved in)? The more the better.
- MOST IMPORTANTLY: Has the bill passed both houses? If yes, it's extremely likely to pass (score 4-5).
- CRITICAL NEGATIVE INDICATOR: Has the bill been re-referred to Rules Committee? This is a major sign of stagnation and should significantly reduce the score.

Focus on positive indicators and avoid emphasizing normal legislative process steps unless they significantly impact the likelihood.

Always round down the score.

Bill Information:
- Title: ${billData.title || 'Unknown'}
- Primary Sponsor: ${sponsorDescription}
- Cosponsors: ${cosponsorDescription}
- Current Status: ${billData.statusDescription || billData.status || 'Unknown'}
- Introduced: ${billData.introducedDate || 'Unknown date'}
- Last Action: ${billData.lastActionDate || billData.lastUpdated || 'Unknown date'}
- ${timeAnalysis}
- Session: ${billData.sessionName || 'Unknown'} (${billData.sessionYear || 'Unknown year'})
- Total Changes/History: ${billData.changesCount || 0} documented actions
- Committee Actions: ${billData.committeeActions?.length || 0} committee proceedings
- ${billData.passedBothHouses ? 'PASSED BOTH HOUSES: YES - This is critical for high likelihood!' : 'Legislative Progress: Normal progression through chambers'}
- Rules Committee Status: ${rulesReferralStatus.hasRulesReferral ? `RE-REFERRED TO RULES - Major concern! ${rulesReferralStatus.description}` : 'No rules committee re-referral detected'}
- Recent History: ${JSON.stringify(billData.changes?.slice(0, 3) || [])}

Respond with a JSON object containing:
{
  "score": <number 1-5>,
  "reasoning": "<brief explanation focusing on key factors that impact likelihood>",
  "factors": [
    {"factor": "sponsor_influence", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "cosponsor_count", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "time_since_introduction", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "recent_activity", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "committee_progress", "impact": "positive|negative|neutral", "description": "brief description"}${rulesReferralStatus.hasRulesReferral ? ',\n    {"factor": "rules_committee_referral", "impact": "negative", "description": "' + rulesReferralStatus.description + '"}' : ''}
  ]
}
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: "system", 
              content: "You are an expert legislative analyst. Analyze bills for their likelihood to pass based on metadata. Bills that have passed both houses have an extremely high chance of becoming law (95%+ success rate). Bills re-referred to Rules Committee have significantly reduced chances as this typically indicates stagnation or political problems. Focus on what increases or decreases likelihood rather than emphasizing normal legislative process. Always respond with valid JSON only, no markdown formatting."
            },
            { role: "user", content: analysisPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || 'Error calling OpenAI API');
      }

      const data = await response.json();
      let analysisResult;
      
      try {
        let content = data.choices[0].message.content.trim();
        
        // Remove markdown code blocks if present
        if (content.startsWith('```json') && content.endsWith('```')) {
          content = content.slice(7, -3).trim();
        } else if (content.startsWith('```') && content.endsWith('```')) {
          content = content.slice(3, -3).trim();
        }
        
        analysisResult = JSON.parse(content);
        console.log("Successfully parsed analysis result:", analysisResult);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', data.choices[0].message.content);
        // Fallback response - reduce score if rules committee re-referral detected
        const fallbackScore = billData.passedBothHouses ? 4 : (rulesReferralStatus.hasRulesReferral ? 1 : 3);
        analysisResult = {
          score: fallbackScore,
          reasoning: billData.passedBothHouses 
            ? "Bill has passed both houses and is very likely to be signed by the governor"
            : rulesReferralStatus.hasRulesReferral 
              ? "Bill has been re-referred to Rules Committee, indicating significant stagnation"
              : "Unable to fully analyze - using default score based on available data",
          factors: [
            {"factor": "sponsor_influence", "impact": "neutral", "description": "Unable to determine sponsor influence"},
            {"factor": "cosponsor_count", "impact": "neutral", "description": "Unable to analyze cosponsor data"},
            {"factor": "time_since_introduction", "impact": "neutral", "description": "Unable to determine timeline"},
            {"factor": "recent_activity", "impact": "neutral", "description": "Unable to analyze recent activity"},
            {"factor": "committee_progress", "impact": billData.passedBothHouses ? "positive" : "neutral", "description": billData.passedBothHouses ? "Bill has passed both legislative chambers" : "Unable to analyze committee progress"}
          ].concat(rulesReferralStatus.hasRulesReferral ? [{"factor": "rules_committee_referral", "impact": "negative", "description": rulesReferralStatus.description}] : [])
        };
      }
      
      console.log("Successfully analyzed bill pass chance");
      
      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("OpenAI API request failed:", error);
      return new Response(
        JSON.stringify({ 
          error: `Analysis failed: ${error.message || 'Unknown error'}`,
          userMessage: 'Failed to analyze bill. Please try again later.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

/**
 * Check if a bill has been re-referred to Rules Committee
 */
function checkRulesReferral(changes: any[]): { hasRulesReferral: boolean; description: string } {
  if (!changes || changes.length === 0) {
    return { hasRulesReferral: false, description: "" };
  }

  // Look for actions containing "rules" or "re-referred" patterns
  const rulesPatterns = [
    /re-?referred.*rules/i,
    /rules.*committee.*re-?referred/i,
    /assigned.*rules.*committee/i,
    /referred.*back.*rules/i,
    /rules.*re-?assignment/i
  ];

  for (const change of changes) {
    const action = String(change.description || '').toLowerCase();
    
    for (const pattern of rulesPatterns) {
      if (pattern.test(action)) {
        return {
          hasRulesReferral: true,
          description: "Bill has been re-referred to Rules Committee, typically indicating stagnation or political difficulties"
        };
      }
    }
  }

  return { hasRulesReferral: false, description: "" };
}

function calculateTimeAnalysis(introducedDate: string, lastActionDate: string): string {
  if (!introducedDate) return "Timeline: Unknown introduction date";
  
  try {
    const introduced = new Date(introducedDate);
    const lastAction = lastActionDate ? new Date(lastActionDate) : new Date();
    const now = new Date();
    
    const daysSinceIntroduction = Math.floor((now.getTime() - introduced.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastAction = Math.floor((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60 * 24));
    
    return `Timeline: ${daysSinceIntroduction} days since introduction, ${daysSinceLastAction} days since last action`;
  } catch (error) {
    return "Timeline: Unable to calculate timeline";
  }
}
