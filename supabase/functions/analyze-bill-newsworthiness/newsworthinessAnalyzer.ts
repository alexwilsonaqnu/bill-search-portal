
import { BillAnalysisData } from "./types.ts";

/**
 * Build the analysis prompt for OpenAI to assess newsworthiness
 */
export function buildNewsworthinessPrompt(billData: BillAnalysisData): string {
  const sponsorDescription = billData.sponsor 
    ? `${billData.sponsor.name} (${billData.sponsor.party || 'Unknown Party'}, ${billData.sponsor.role || 'Unknown Role'}, District: ${billData.sponsor.district || 'Unknown'})`
    : 'No primary sponsor identified';

  const cosponsorDescription = billData.cosponsorCount > 0 
    ? `${billData.cosponsorCount} cosponsors from various parties and chambers`
    : 'No cosponsors identified';

  const timeAnalysis = calculateTimeAnalysis(billData.introducedDate, billData.lastActionDate);

  // Extract bill content for analysis
  const billContent = extractBillContent(billData);
  
  // Get recent activity indicators
  const recentActivityDescription = getRecentActivityDescription(billData.changes || []);

  return `
You are analyzing the newsworthiness of a legislative bill on a scale from 1-100, where 1 is not newsworthy at all and 100 is extremely newsworthy and likely to generate significant media coverage.

Consider these specific criteria for newsworthiness:

1. CONTROVERSIAL OR HIGH-PROFILE LANGUAGE: Does the bill contain language related to hot-button issues? Look for terms related to:
   - Education reform, school choice, curriculum changes
   - Public safety, police reform, crime prevention
   - Healthcare, abortion, reproductive rights
   - Taxation, budget, government spending
   - Environmental issues, climate change
   - Civil rights, discrimination, equality
   - Immigration, border security
   - Gun rights, Second Amendment
   - Technology, privacy, surveillance

2. SPONSOR VISIBILITY: Is the primary sponsor a high-profile legislator who frequently appears in media or holds leadership positions?

3. PUBLIC IMPACT POTENTIAL: How many people would be directly affected by this legislation? Consider:
   - Statewide vs. limited scope
   - Number of people impacted
   - Economic implications
   - Social implications

4. POLITICAL DYNAMICS: Consider:
   - Bipartisan vs. partisan sponsorship
   - Committee assignments and progress
   - Timing relative to elections or major events

5. TRENDING ISSUES: Does this bill align with current hot topics in the news or social media?

6. LEGISLATIVE MOMENTUM: Recent activity, committee hearings, and bill progress can indicate newsworthiness

7. PASS CHANCE CORRELATION: Bills more likely to pass (or surprisingly unlikely to pass) can be more newsworthy

${billData.passChanceScore ? `PASS CHANCE CONTEXT: This bill has a pass chance score of ${billData.passChanceScore}/5, which should factor into newsworthiness assessment.` : ''}

Bill Information:
- Title: ${billData.title || 'Unknown'}
- Description: ${billData.description || 'No description available'}
- Primary Sponsor: ${sponsorDescription}
- Cosponsors: ${cosponsorDescription}
- Current Status: ${billData.statusDescription || billData.status || 'Unknown'}
- ${timeAnalysis}
- Session: ${billData.sessionName || 'Unknown'} (${billData.sessionYear || 'Unknown year'})
- Total Legislative Actions: ${billData.changesCount || 0}
- Recent Activity: ${recentActivityDescription}
- Bill Content Keywords: ${billContent}

Respond with a JSON object containing:
{
  "score": <number 1-100>,
  "reasoning": "<brief explanation of why this bill scored this newsworthiness rating>",
  "factors": [
    {"factor": "controversial_language", "impact": "positive|negative|neutral", "description": "assessment of controversial or hot-button language"},
    {"factor": "sponsor_profile", "impact": "positive|negative|neutral", "description": "assessment of sponsor visibility and media presence"},
    {"factor": "public_impact", "impact": "positive|negative|neutral", "description": "assessment of potential public impact"},
    {"factor": "political_dynamics", "impact": "positive|negative|neutral", "description": "assessment of political context and dynamics"},
    {"factor": "trending_alignment", "impact": "positive|negative|neutral", "description": "assessment of alignment with trending issues"},
    {"factor": "legislative_momentum", "impact": "positive|negative|neutral", "description": "assessment of recent activity and momentum"}
  ]
}`;
}

/**
 * Calculate time analysis for bill progression
 */
function calculateTimeAnalysis(introducedDate: string, lastActionDate: string): string {
  if (!introducedDate) return "Timeline: Unknown introduction date";
  
  try {
    const introduced = new Date(introducedDate);
    const lastAction = lastActionDate ? new Date(lastActionDate) : new Date();
    const now = new Date();
    
    if (isNaN(introduced.getTime())) {
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
 * Extract relevant content from bill data for keyword analysis
 */
function extractBillContent(billData: BillAnalysisData): string {
  const keywords: string[] = [];
  
  // Extract from title
  if (billData.title) {
    keywords.push(billData.title);
  }
  
  // Extract from description
  if (billData.description) {
    keywords.push(billData.description);
  }
  
  // Extract from recent actions (looking for committee assignments, etc.)
  if (billData.changes && billData.changes.length > 0) {
    const recentActions = billData.changes.slice(0, 5).map(change => change.description || '').join(' ');
    keywords.push(recentActions);
  }
  
  return keywords.join(' ').substring(0, 1000); // Limit to avoid token overflow
}

/**
 * Get description of recent legislative activity
 */
function getRecentActivityDescription(changes: any[]): string {
  if (!changes || changes.length === 0) {
    return "No recent activity";
  }
  
  const recentChanges = changes.slice(0, 3);
  const descriptions = recentChanges.map(change => change.description || '').filter(desc => desc.length > 0);
  
  if (descriptions.length === 0) {
    return "No recent meaningful activity";
  }
  
  return descriptions.slice(0, 2).join('; ');
}
