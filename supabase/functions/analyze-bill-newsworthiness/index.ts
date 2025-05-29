
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface BillAnalysisData {
  id: string;
  title: string;
  sponsor?: {
    name: string;
    party: string;
    role: string;
    district: string;
  };
  cosponsors?: any[];
  cosponsorCount: number;
  status?: string;
  statusDescription?: string;
  introducedDate?: string;
  lastActionDate?: string;
  lastUpdated?: string;
  sessionName?: string;
  sessionYear?: string;
  changes?: any[];
  changesCount: number;
  committeeActions?: any[];
  passedBothHouses?: boolean;
  data?: any;
  passChanceScore?: number;
  description?: string;
}

interface NewsworthinessAnalysis {
  score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
}

function buildNewsworthinessPrompt(billData: BillAnalysisData): string {
  const sponsorDescription = billData.sponsor 
    ? `${billData.sponsor.name} (${billData.sponsor.party || 'Unknown Party'}, ${billData.sponsor.role || 'Unknown Role'}, District: ${billData.sponsor.district || 'Unknown'})`
    : 'No primary sponsor identified';

  const cosponsorDescription = billData.cosponsorCount > 0 
    ? `${billData.cosponsorCount} cosponsors from various parties and chambers`
    : 'No cosponsors identified';

  const timeAnalysis = calculateTimeAnalysis(billData.introducedDate, billData.lastActionDate);
  const billContent = extractBillContent(billData);
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

function calculateTimeAnalysis(introducedDate?: string, lastActionDate?: string): string {
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

function extractBillContent(billData: BillAnalysisData): string {
  const keywords: string[] = [];
  
  if (billData.title) {
    keywords.push(billData.title);
  }
  
  if (billData.description) {
    keywords.push(billData.description);
  }
  
  if (billData.changes && billData.changes.length > 0) {
    const recentActions = billData.changes.slice(0, 5).map(change => change.description || '').join(' ');
    keywords.push(recentActions);
  }
  
  return keywords.join(' ').substring(0, 1000);
}

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

async function analyzeWithOpenAI(prompt: string, apiKey: string): Promise<NewsworthinessAnalysis> {
  console.log("Sending newsworthiness analysis request to OpenAI");
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert political analyst and journalist who specializes in assessing the newsworthiness of legislative bills. You understand what makes bills likely to generate media coverage and public interest.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("Unexpected OpenAI response format:", data);
    throw new Error("Invalid response format from OpenAI");
  }

  const content = data.choices[0].message.content;
  
  try {
    const result = JSON.parse(content);
    console.log("Successfully parsed newsworthiness analysis result:", result);
    return result;
  } catch (error) {
    console.error("Failed to parse OpenAI response as JSON:", content);
    throw new Error("Failed to parse analysis result from OpenAI");
  }
}

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
