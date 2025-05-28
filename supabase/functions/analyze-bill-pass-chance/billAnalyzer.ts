
import { BillAnalysisData, RulesReferralResult } from "./types.ts";

/**
 * Parse date string and return Date object, handling various formats
 */
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  // Try various date formats
  const formats = [
    // Try direct parsing first
    () => new Date(dateStr),
    // Try with specific formats
    () => {
      // Handle "Apr 11, 2025" format
      const match = dateStr.match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/);
      if (match) {
        const [, month, day, year] = match;
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        return new Date(parseInt(year), monthMap[month], parseInt(day));
      }
      return null;
    },
    // Handle YYYY-MM-DD format
    () => {
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
      }
      return null;
    }
  ];
  
  for (const formatFn of formats) {
    try {
      const result = formatFn();
      if (result && !isNaN(result.getTime()) && result.getTime() > 0) {
        return result;
      }
    } catch (e) {
      // Continue to next format
    }
  }
  
  return new Date(0);
}

/**
 * Check if a bill has been re-referred to Rules Committee with enhanced detection
 */
export function checkRulesReferral(changes: any[]): RulesReferralResult {
  if (!changes || changes.length === 0) {
    return { hasRulesReferral: false, description: "" };
  }

  // Enhanced patterns to detect rules committee re-referrals
  const rulesPatterns = [
    /re-?referred.*rules/i,
    /rules.*committee.*re-?referred/i,
    /assigned.*rules.*committee/i,
    /referred.*back.*rules/i,
    /rules.*re-?assignment/i,
    /rule\s*19.*re-?referred.*rules/i,
    /re-?referred.*rules.*committee/i,
    /rules.*committee.*referral/i
  ];

  // Sort changes by date to find the most recent rules referral
  const sortedChanges = [...changes].sort((a, b) => {
    const dateA = parseDate(a.details || a.date || '');
    const dateB = parseDate(b.details || b.date || '');
    return dateB.getTime() - dateA.getTime();
  });

  // Look through changes from most recent to oldest
  for (const change of sortedChanges) {
    const action = String(change.description || change.action || '').toLowerCase();
    const date = change.details || change.date;
    
    for (const pattern of rulesPatterns) {
      if (pattern.test(action)) {
        // Calculate days since referral
        let daysSinceReferral = 0;
        if (date) {
          try {
            const referralDate = parseDate(date);
            const now = new Date();
            daysSinceReferral = Math.floor((now.getTime() - referralDate.getTime()) / (1000 * 60 * 60 * 24));
          } catch (error) {
            console.warn("Could not parse referral date:", date);
          }
        }

        return {
          hasRulesReferral: true,
          description: `Bill re-referred to Rules Committee${daysSinceReferral > 0 ? ` ${daysSinceReferral} days ago` : ''}, typically indicating stagnation or political difficulties`,
          daysSinceReferral
        };
      }
    }
  }

  return { hasRulesReferral: false, description: "" };
}

/**
 * Calculate time analysis for bill progression with improved date parsing
 */
export function calculateTimeAnalysis(introducedDate: string, lastActionDate: string): string {
  if (!introducedDate) return "Timeline: Unknown introduction date";
  
  try {
    const introduced = parseDate(introducedDate);
    const lastAction = lastActionDate ? parseDate(lastActionDate) : new Date();
    const now = new Date();
    
    if (introduced.getTime() === 0) {
      return "Timeline: Unable to parse introduction date";
    }
    
    const daysSinceIntroduction = Math.floor((now.getTime() - introduced.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastAction = Math.floor((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60 * 24));
    
    return `Timeline: ${daysSinceIntroduction} days since introduction, ${daysSinceLastAction} days since last action`;
  } catch (error) {
    return "Timeline: Unable to calculate timeline";
  }
}

/**
 * Build the analysis prompt for OpenAI
 */
export function buildAnalysisPrompt(billData: BillAnalysisData, rulesReferralStatus: RulesReferralResult): string {
  const sponsorDescription = billData.sponsor 
    ? `${billData.sponsor.name} (${billData.sponsor.party || 'Unknown Party'}, ${billData.sponsor.role || 'Unknown Role'}, District: ${billData.sponsor.district || 'Unknown'})`
    : 'No primary sponsor identified';

  const cosponsorDescription = billData.cosponsorCount > 0 
    ? `${billData.cosponsorCount} cosponsors from various parties and chambers`
    : 'No cosponsors identified';

  const timeAnalysis = calculateTimeAnalysis(billData.introducedDate, billData.lastActionDate);

  const passedBothHousesNote = billData.passedBothHouses 
    ? "CRITICAL: This bill has PASSED BOTH HOUSES and is awaiting governor approval. Historically, over 95% of bills that pass both houses are signed by the governor. This should result in a score of 4 or 5."
    : "";

  // Enhanced rules committee warning with time consideration
  const rulesReferralNote = rulesReferralStatus.hasRulesReferral
    ? `MAJOR CONCERN: This bill has been re-referred to the Rules Committee${rulesReferralStatus.daysSinceReferral ? ` ${rulesReferralStatus.daysSinceReferral} days ago` : ''}. Rules committee re-referrals are typically a significant indicator of stagnation and political difficulties. Bills that sit in Rules Committee for extended periods (especially 30+ days) are often considered effectively dead. This should significantly lower the pass chance score (reduce by 2-3 points for recent referrals, or set to 1 if it's been over 30 days without action).`
    : "";

  return `
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
- CRITICAL NEGATIVE INDICATOR: Has the bill been re-referred to Rules Committee? This is a major sign of stagnation and should significantly reduce the score. If it's been over 30 days since Rules referral, consider the bill effectively dead (score 1).

Focus on positive indicators and significant negative indicators. Do not mention the absence of negative indicators unless they are particularly significant.

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
- ${billData.passedBothHouses ? 'PASSED BOTH HOUSES: YES - This is critical for high likelihood!' : 'Legislative Progress: Normal progression through chambers'}${rulesReferralStatus.hasRulesReferral ? `\n- Rules Committee Status: RE-REFERRED TO RULES - Major concern! ${rulesReferralStatus.description}` : ''}
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
}
