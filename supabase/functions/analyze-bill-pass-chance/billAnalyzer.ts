
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
 * Check if a bill has been re-referred to Rules Committee
 * CRITICAL: ONLY analyzes legislative actions, completely ignores bill content
 * Now also checks for activity after re-referral to determine if bill is still active
 */
export function checkRulesReferral(changes: any[]): RulesReferralResult {
  if (!changes || changes.length === 0) {
    return { hasRulesReferral: false, description: "" };
  }

  console.log("DEBUG: Checking rules referral for changes:", JSON.stringify(changes, null, 2));

  // ULTRA-CONSERVATIVE: Only flag if we see EXPLICIT re-referral language
  // These patterns indicate this is a RE-referral, not an initial referral
  const explicitReReferralPatterns = [
    /rule\s*19\s*\(\s*a\s*\)\s*\/\s*re-?referred.*to.*rules/i,
    /re-?referred.*to.*rules/i,
    /returned.*to.*rules/i,
    /sent.*back.*to.*rules/i,
    /recommitted.*to.*rules/i,
    /re-?assigned.*to.*rules/i,
    /back.*to.*rules.*committee/i,
    /again.*referred.*to.*rules/i,
    /once.*again.*to.*rules/i
  ];

  let explicitReReferralFound = false;
  let reReferralDetails = null;
  let daysSinceReferral = 0;
  let reReferralDate: Date | null = null;
  let hasActivityAfterReferral = false;

  // Sort changes by date to analyze chronologically
  const sortedChanges = [...changes].sort((a, b) => {
    const dateA = parseDate(a.details || '');
    const dateB = parseDate(b.details || '');
    return dateA.getTime() - dateB.getTime();
  });

  // First pass: find the re-referral
  for (const change of sortedChanges) {
    // CRITICAL: Only look at the action description, never bill content
    const action = String(change.description || change.action || '').toLowerCase().trim();
    
    console.log("DEBUG: Analyzing legislative action only:", action);
    
    // ONLY flag if we find explicit re-referral language in the LEGISLATIVE ACTION
    const hasExplicitReReferralLanguage = explicitReReferralPatterns.some(pattern => pattern.test(action));
    
    if (hasExplicitReReferralLanguage) {
      console.log("DEBUG: Found explicit re-referral language in legislative action:", action);
      explicitReReferralFound = true;
      reReferralDetails = change;
      
      // Parse the re-referral date
      const date = change.details || change.date;
      if (date) {
        try {
          reReferralDate = parseDate(date);
          const now = new Date();
          daysSinceReferral = Math.floor((now.getTime() - reReferralDate.getTime()) / (1000 * 60 * 60 * 24));
        } catch (error) {
          console.warn("Could not parse referral date:", date);
        }
      }
      break;
    }
    
    // Log normal referrals for debugging but don't flag them
    if (action.includes('referred to rules') && !hasExplicitReReferralLanguage) {
      console.log("DEBUG: Found normal initial Rules Committee referral (not flagging):", action);
    }
  }

  // Second pass: if we found a re-referral, check for activity after it
  if (explicitReReferralFound && reReferralDate) {
    for (const change of sortedChanges) {
      const changeDate = parseDate(change.details || change.date || '');
      
      // If this change happened after the re-referral
      if (changeDate.getTime() > reReferralDate.getTime()) {
        const action = String(change.description || change.action || '').toLowerCase().trim();
        
        // Check if this is meaningful legislative activity (not just administrative)
        const meaningfulActivity = [
          'added co-sponsor',
          'added as co-sponsor',
          'committee',
          'amendment',
          'reading',
          'assigned',
          'do pass',
          'motion'
        ];
        
        if (meaningfulActivity.some(activity => action.includes(activity))) {
          hasActivityAfterReferral = true;
          console.log("DEBUG: Found meaningful activity after re-referral:", action);
          break;
        }
      }
    }
  }

  console.log("DEBUG: Explicit re-referral found:", explicitReReferralFound);
  console.log("DEBUG: Has activity after re-referral:", hasActivityAfterReferral);

  // Only flag if we found explicit re-referral language in legislative actions
  if (explicitReReferralFound && reReferralDetails) {
    // If there's been activity after the re-referral, it's less concerning
    if (hasActivityAfterReferral) {
      return {
        hasRulesReferral: true,
        description: `Bill was re-referred to Rules Committee${daysSinceReferral > 0 ? ` ${daysSinceReferral} days ago` : ''}, but has shown continued activity since then, indicating it may still be viable`,
        daysSinceReferral
      };
    } else {
      // No activity after re-referral is more concerning
      return {
        hasRulesReferral: true,
        description: `Bill explicitly re-referred to Rules Committee${daysSinceReferral > 0 ? ` ${daysSinceReferral} days ago` : ''} with no subsequent activity, indicating potential stagnation or political difficulties`,
        daysSinceReferral
      };
    }
  }

  // For any normal Rules Committee reference (like "Referred to Rules Committee"), 
  // treat it as normal legislative process and DON'T flag it
  console.log("DEBUG: No problematic rules referral detected - treating as normal legislative process");
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
    ? `MAJOR CONCERN: This bill has been explicitly re-referred to the Rules Committee${rulesReferralStatus.daysSinceReferral ? ` ${rulesReferralStatus.daysSinceReferral} days ago` : ''}. Explicit rules committee re-referrals are typically a significant indicator of stagnation and should significantly reduce the score. If it's been over 30 days since Rules referral, consider the bill effectively dead (score 1).`
    : "";

  return `
You are analyzing the likelihood that a legislative bill will pass. Based on the bill metadata provided, give a score from 1-5 where 1 is very unlikely to pass and 5 is extremely likely to pass.

${passedBothHousesNote}

${rulesReferralNote}

Consider these factors:
- Who is the primary sponsor of the bill and how influential are they?
- How many cosponsors? The more the better, the more bipartisan sponsors the better.
- IMPORTANT: Recent activity is the most important timeline factor. If there has been recent legislative activity (within the last 30 days), this indicates the bill is alive and moving, regardless of how long ago it was introduced. A bill introduced months ago but with recent actions should NOT be penalized for the introduction timeline.
- How many changes has it had? More recent changes means there's movement in the bill, which is good.
- How many committees has it gone through (and been approved in)? The more the better.
- MOST IMPORTANTLY: Has the bill passed both houses? If yes, it's extremely likely to pass (score 4-5).
- CRITICAL NEGATIVE INDICATOR: Has the bill been explicitly re-referred to Rules Committee? This is a major sign of stagnation and should significantly reduce the score. If it's been over 30 days since Rules referral, consider the bill effectively dead (score 1).

IMPORTANT: Do not mention normal legislative processes as negative factors. Being initially referred to Rules Committee is completely normal - all bills start there. Only mention Rules Committee if there's been an explicit re-referral with specific re-referral language. Most bills have not passed both houses yet, most bills have not been signed by the governor yet - these are normal states and should not be mentioned unless there's a specific reason the bill should have progressed further. Focus only on positive indicators and significant negative indicators (like explicit Rules Committee re-referrals or complete lack of activity).

CRITICAL INSTRUCTION: If you see "Referred to Rules Committee" in the bill history, this is NORMAL LEGISLATIVE PROCESS and should NOT be mentioned as a negative factor or concern. Only mention Rules Committee issues if there are explicit re-referral patterns like "re-referred to Rules Committee" or "returned to Rules Committee".

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
- ${billData.passedBothHouses ? 'PASSED BOTH HOUSES: YES - This is critical for high likelihood!' : 'Legislative Progress: Normal progression through chambers'}${rulesReferralStatus.hasRulesReferral ? `\n- Rules Committee Status: EXPLICITLY RE-REFERRED TO RULES - Major concern! ${rulesReferralStatus.description}` : ''}
- Recent History: ${JSON.stringify(billData.changes?.slice(0, 3) || [])}

Respond with a JSON object containing:
{
  "score": <number 1-5>,
  "reasoning": "<brief explanation focusing on key factors that impact likelihood>",
  "factors": [
    {"factor": "sponsor_influence", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "cosponsor_count", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "timeline_and_activity", "impact": "positive|negative|neutral", "description": "brief description focusing on recent activity over introduction timeline"},
    {"factor": "recent_activity", "impact": "positive|negative|neutral", "description": "brief description"},
    {"factor": "committee_progress", "impact": "positive|negative|neutral", "description": "brief description"}${rulesReferralStatus.hasRulesReferral ? ',\n    {"factor": "rules_committee_referral", "impact": "negative", "description": "' + rulesReferralStatus.description + '"}' : ''}
  ]
}`;
}
