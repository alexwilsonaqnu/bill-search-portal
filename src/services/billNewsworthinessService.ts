
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";
import { getSponsorName } from "@/services/legislator/simple";

export interface NewsworthinessAnalysis {
  score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
}

/**
 * Extract the introduction date from the bill's history
 */
function getIntroductionDate(bill: Bill): string | null {
  if (!bill.changes || bill.changes.length === 0) {
    return null;
  }
  
  // Sort changes by date to find the earliest
  const sortedChanges = [...bill.changes].sort((a, b) => {
    const dateA = new Date(a.details || '').getTime();
    const dateB = new Date(b.details || '').getTime();
    return dateA - dateB;
  });
  
  // Look for introduction-related actions
  const introductionKeywords = ['filed', 'introduced', 'first reading', 'prefiled'];
  
  for (const change of sortedChanges) {
    const action = String(change.description || '').toLowerCase();
    if (introductionKeywords.some(keyword => action.includes(keyword))) {
      return change.details;
    }
  }
  
  // If no specific introduction action found, use the earliest action
  const firstAction = sortedChanges[0];
  if (firstAction && firstAction.details) {
    return firstAction.details;
  }
  
  return null;
}

/**
 * Get the most recent action date from the bill's history
 */
function getLastActionDate(bill: Bill): string | null {
  if (!bill.changes || bill.changes.length === 0) {
    return bill.lastUpdated || null;
  }
  
  // Sort changes by date to find the most recent
  const sortedChanges = [...bill.changes].sort((a, b) => {
    const dateA = new Date(a.details || '').getTime();
    const dateB = new Date(b.details || '').getTime();
    return dateB - dateA;
  });
  
  const mostRecentAction = sortedChanges[0];
  return mostRecentAction?.details || bill.lastUpdated || null;
}

/**
 * Get a meaningful status description from the bill data
 */
function getStatusDescription(bill: Bill): string {
  const statusDesc = bill.data?.status_description || bill.data?.current_status_description;
  if (statusDesc && typeof statusDesc === 'string' && statusDesc !== bill.status) {
    return statusDesc;
  }
  
  const rawStatus = bill.status || bill.data?.status || bill.data?.current_status;
  if (rawStatus) {
    if (/^\d+$/.test(String(rawStatus))) {
      return `Status ${rawStatus} - In committee review`;
    }
    return String(rawStatus);
  }
  
  return 'Unknown status';
}

export async function analyzeBillNewsworthiness(bill: Bill, passChanceScore?: number): Promise<NewsworthinessAnalysis | null> {
  try {
    console.log("analyzeBillNewsworthiness: Starting analysis for bill:", bill.id);
    console.log("analyzeBillNewsworthiness: Bill title:", bill.title);
    console.log("analyzeBillNewsworthiness: Pass chance score:", passChanceScore);
    
    // Extract sponsor information
    const primarySponsor = getSponsor(bill);
    const cosponsors = getCoSponsors(bill);
    
    console.log("analyzeBillNewsworthiness: Primary sponsor:", primarySponsor);
    console.log("analyzeBillNewsworthiness: Co-sponsors count:", cosponsors.length);
    
    // Format sponsor information
    const sponsorInfo = primarySponsor && typeof primarySponsor === 'object' ? {
      name: getSponsorName(primarySponsor),
      party: primarySponsor.party || 'Unknown',
      role: primarySponsor.role || 'Unknown',
      district: primarySponsor.district || 'Unknown'
    } : null;
    
    // Extract dates
    const introductionDate = getIntroductionDate(bill);
    const lastActionDate = getLastActionDate(bill);
    
    // Get status description
    const currentStatus = getStatusDescription(bill);
    
    // Extract committee progress
    const committeeActions = bill.data?.progress || bill.data?.committee_actions || bill.data?.history || [];
    
    const billData = {
      id: bill.id,
      title: bill.title,
      description: bill.description,
      sponsor: sponsorInfo,
      cosponsors: cosponsors,
      cosponsorCount: cosponsors.length,
      status: bill.status,
      statusDescription: currentStatus,
      introducedDate: introductionDate,
      lastActionDate: lastActionDate,
      lastUpdated: bill.lastUpdated,
      sessionName: bill.sessionName,
      sessionYear: bill.sessionYear,
      changes: bill.changes || [],
      changesCount: (bill.changes || []).length,
      committeeActions: committeeActions,
      passedBothHouses: false, // Could be enhanced later
      data: bill.data,
      passChanceScore: passChanceScore
    };
    
    console.log("analyzeBillNewsworthiness: Sending analysis request with data:", billData);
    
    const { data, error } = await supabase.functions.invoke('analyze-bill-newsworthiness', {
      body: { billData }
    });

    if (error) {
      console.error("analyzeBillNewsworthiness: Supabase function error:", error);
      console.error("analyzeBillNewsworthiness: Error details:", JSON.stringify(error, null, 2));
      return null;
    }

    if (data?.error) {
      console.error("analyzeBillNewsworthiness: Service returned error:", data);
      return null;
    }

    console.log("analyzeBillNewsworthiness: Successfully received analysis:", data);
    return data as NewsworthinessAnalysis;
  } catch (error) {
    console.error("analyzeBillNewsworthiness: Failed to analyze bill newsworthiness:", error);
    console.error("analyzeBillNewsworthiness: Error stack:", error.stack);
    return null;
  }
}
