
import { BillAnalysisData, PassChanceAnalysis } from "./types.ts";

/**
 * Call OpenAI API to analyze bill pass chance
 */
export async function analyzeWithOpenAI(prompt: string, openAIApiKey: string): Promise<PassChanceAnalysis> {
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
          content: "You are an expert legislative analyst. Analyze bills for their likelihood to pass based on metadata. Bills that have passed both houses have an extremely high chance of becoming law (95%+ success rate). Bills re-referred to Rules Committee have significantly reduced chances as this typically indicates stagnation or political problems, especially if over 30 days have passed. Focus on what increases or decreases likelihood rather than emphasizing normal legislative process. Do not mention the absence of normal legislative milestones (like not passing both houses, not being signed, etc.) unless they are particularly significant indicators. Most bills haven't passed both houses yet - that's normal and shouldn't be mentioned as a negative unless there's a specific reason why the bill should have progressed further by now. Always respond with valid JSON only, no markdown formatting."
        },
        { role: "user", content: prompt }
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
  let content = data.choices[0].message.content.trim();
  
  // Remove markdown code blocks if present
  if (content.startsWith('```json') && content.endsWith('```')) {
    content = content.slice(7, -3).trim();
  } else if (content.startsWith('```') && content.endsWith('```')) {
    content = content.slice(3, -3).trim();
  }
  
  return JSON.parse(content);
}

/**
 * Create fallback analysis when OpenAI fails
 */
export function createFallbackAnalysis(billData: BillAnalysisData, rulesReferralStatus: { hasRulesReferral: boolean; description: string; daysSinceReferral?: number }): PassChanceAnalysis {
  let fallbackScore = 3; // Default neutral score
  
  if (billData.passedBothHouses) {
    fallbackScore = 4;
  } else if (rulesReferralStatus.hasRulesReferral) {
    // If rules referral is over 30 days old, consider it dead
    if (rulesReferralStatus.daysSinceReferral && rulesReferralStatus.daysSinceReferral > 30) {
      fallbackScore = 1;
    } else {
      fallbackScore = 1; // Significant reduction for rules referral
    }
  }
  
  const baseFactors = [
    {"factor": "sponsor_influence", "impact": "neutral", "description": "Unable to determine sponsor influence"},
    {"factor": "cosponsor_count", "impact": "neutral", "description": "Unable to analyze cosponsor data"},
    {"factor": "time_since_introduction", "impact": "neutral", "description": "Unable to determine timeline"},
    {"factor": "recent_activity", "impact": "neutral", "description": "Unable to analyze recent activity"},
    {"factor": "committee_progress", "impact": billData.passedBothHouses ? "positive" : "neutral", "description": billData.passedBothHouses ? "Bill has passed both legislative chambers" : "Unable to analyze committee progress"}
  ];
  
  // Only add rules committee factor if there actually is a rules referral
  const factors = rulesReferralStatus.hasRulesReferral 
    ? baseFactors.concat([{"factor": "rules_committee_referral", "impact": "negative", "description": rulesReferralStatus.description}])
    : baseFactors;
  
  return {
    score: fallbackScore,
    reasoning: billData.passedBothHouses 
      ? "Bill has passed both houses and is very likely to be signed by the governor"
      : rulesReferralStatus.hasRulesReferral 
        ? `Bill has been re-referred to Rules Committee${rulesReferralStatus.daysSinceReferral ? ` ${rulesReferralStatus.daysSinceReferral} days ago` : ''}, indicating significant stagnation`
        : "Unable to fully analyze - using default score based on available data",
    factors
  };
}
