
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";
import { getSponsorName } from "@/services/legislator/simple";

export interface PassChanceAnalysis {
  score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
  hasPassed?: boolean;
}

/**
 * Check if a bill has already passed based on its status and history
 * A bill is only considered passed if the final action is "Public Act . . . . . . . .[id]"
 */
function checkIfBillPassed(bill: Bill): boolean {
  // Check status fields for final enacted indicators
  const status = String(bill.status || '').toLowerCase();
  const statusDescription = String(bill.data?.status_description || '').toLowerCase();
  const currentStatus = String(bill.data?.current_status || '').toLowerCase();
  
  const finalPassedIndicators = ['enacted', 'signed', 'approved by governor', 'effective', 'became law'];
  
  // First check if status indicates final passage
  if (finalPassedIndicators.some(indicator => 
    status.includes(indicator) || 
    statusDescription.includes(indicator) || 
    currentStatus.includes(indicator)
  )) {
    return true;
  }
  
  // Check history for "Public Act" as the final action
  if (bill.changes && bill.changes.length > 0) {
    // Sort changes by date if possible, otherwise use order
    const sortedChanges = [...bill.changes];
    
    // Get the most recent action (last in the sorted array)
    const lastAction = sortedChanges[sortedChanges.length - 1];
    if (lastAction) {
      const action = String(lastAction.description || '').toLowerCase();
      
      // Check if the last action is "Public Act"
      if (action.includes('public act')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if a bill has passed both houses (awaiting governor approval)
 */
function checkIfPassedBothHouses(bill: Bill): boolean {
  if (bill.changes && bill.changes.length > 0) {
    for (const change of bill.changes) {
      const action = String(change.description || '').toLowerCase();
      
      // Check for "passed both houses" or similar
      if (action.includes('passed both houses') || 
          action.includes('passed both chambers')) {
        return true;
      }
    }
  }
  
  return false;
}

export async function analyzeBillPassChance(bill: Bill): Promise<PassChanceAnalysis | null> {
  try {
    console.log("Analyzing pass chance for bill:", bill.id);
    
    // First check if the bill has already passed
    const hasPassed = checkIfBillPassed(bill);
    
    if (hasPassed) {
      console.log("Bill has already passed, returning passed status");
      return {
        score: 5,
        reasoning: "This bill has already passed and become a Public Act according to its legislative history.",
        factors: [{
          factor: "bill_status",
          impact: "positive",
          description: "The bill has completed the legislative process and has been enacted into law."
        }],
        hasPassed: true
      };
    }
    
    // Check if bill has passed both houses (very high chance to pass)
    const passedBothHouses = checkIfPassedBothHouses(bill);
    
    // Extract sponsor information properly
    const primarySponsor = getSponsor(bill);
    const cosponsors = getCoSponsors(bill);
    
    // Format sponsor information for the analysis
    const sponsorInfo = primarySponsor && typeof primarySponsor === 'object' ? {
      name: getSponsorName(primarySponsor),
      party: primarySponsor.party || 'Unknown',
      role: primarySponsor.role || 'Unknown',
      district: primarySponsor.district || 'Unknown'
    } : null;
    
    const cosponsorInfo = cosponsors.map(cosponsor => ({
      name: getSponsorName(cosponsor),
      party: typeof cosponsor === 'object' ? (cosponsor.party || 'Unknown') : 'Unknown',
      role: typeof cosponsor === 'object' ? (cosponsor.role || 'Unknown') : 'Unknown'
    }));
    
    // Extract timeline and status information
    const introducedDate = bill.data?.introducedDate || bill.data?.introduced_date || bill.data?.created_date;
    const lastActionDate = bill.data?.lastActionDate || bill.data?.last_action_date || bill.lastUpdated;
    const currentStatus = bill.data?.status_description || bill.data?.current_status || bill.status;
    
    // Format history/changes for analysis
    const historyItems = bill.changes?.map(change => ({
      action: change.description,
      date: change.details
    })) || [];
    
    // Extract committee progress
    const committeeActions = bill.data?.progress || bill.data?.committee_actions || bill.data?.history || [];
    
    console.log("Formatted sponsor info:", sponsorInfo);
    console.log("Formatted cosponsor info:", cosponsorInfo);
    console.log("History items count:", historyItems.length);
    console.log("Committee actions count:", committeeActions.length);
    console.log("Passed both houses:", passedBothHouses);
    
    const { data, error } = await supabase.functions.invoke('analyze-bill-pass-chance', {
      body: { 
        billData: {
          id: bill.id,
          title: bill.title,
          sponsor: sponsorInfo,
          cosponsors: cosponsorInfo,
          cosponsorCount: cosponsors.length,
          status: bill.status,
          statusDescription: currentStatus,
          introducedDate: introducedDate,
          lastActionDate: lastActionDate,
          lastUpdated: bill.lastUpdated,
          sessionName: bill.sessionName,
          sessionYear: bill.sessionYear,
          changes: historyItems,
          changesCount: historyItems.length,
          committeeActions: committeeActions,
          passedBothHouses: passedBothHouses, // Add this important flag
          data: bill.data
        }
      }
    });

    if (error) {
      console.error("Error analyzing bill pass chance:", error);
      return null;
    }

    if (data?.error) {
      console.error("Analysis service returned error:", data);
      return null;
    }

    console.log("Successfully received pass chance analysis");
    return data as PassChanceAnalysis;
  } catch (error) {
    console.error("Failed to analyze bill pass chance:", error);
    return null;
  }
}
