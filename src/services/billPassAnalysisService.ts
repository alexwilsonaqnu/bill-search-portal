
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
}

export async function analyzeBillPassChance(bill: Bill): Promise<PassChanceAnalysis | null> {
  try {
    console.log("Analyzing pass chance for bill:", bill.id);
    
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
