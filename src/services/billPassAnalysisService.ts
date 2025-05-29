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
 * Check if a bill has already passed based on its status and history
 * FIXED: Made much more conservative to avoid false positives
 */
function checkIfBillPassed(bill: Bill): boolean {
  console.log("DEBUG: Checking if bill has passed for bill:", bill.id);
  
  // Check status fields for final enacted indicators - be very specific
  const status = String(bill.status || '').toLowerCase();
  const statusDescription = String(bill.data?.status_description || '').toLowerCase();
  const currentStatus = String(bill.data?.current_status || '').toLowerCase();
  
  console.log("DEBUG: Status checks - status:", status, "statusDescription:", statusDescription, "currentStatus:", currentStatus);
  
  // Only very specific final passage indicators
  const finalPassedIndicators = [
    'enacted', 
    'signed by governor', 
    'approved by governor', 
    'effective immediately',
    'became law',
    'public act',
    'pa ' // Public Act prefix
  ];
  
  // First check if status indicates final passage - be very conservative
  const statusIndicatesPassage = finalPassedIndicators.some(indicator => 
    status.includes(indicator) || 
    statusDescription.includes(indicator) || 
    currentStatus.includes(indicator)
  );
  
  if (statusIndicatesPassage) {
    console.log("DEBUG: Status indicates final passage");
    return true;
  }
  
  // Check history for final passage indicators - be even more selective
  if (bill.changes && bill.changes.length > 0) {
    console.log("DEBUG: Checking bill changes for passage indicators");
    
    // Sort changes by date to find the most recent
    const sortedChanges = [...bill.changes].sort((a, b) => {
      const dateA = parseDate(a.details || '');
      const dateB = parseDate(b.details || '');
      return dateB.getTime() - dateA.getTime();
    });
    
    // Check for very specific final passage language only
    for (const change of sortedChanges) {
      const action = String(change.description || '').toLowerCase();
      console.log("DEBUG: Checking action for passage:", action);
      
      // Only check for very specific final passage indicators
      if (action.includes('public act') ||
          action.includes('signed by governor') ||
          action.includes('approved by governor') ||
          action.includes('became law') ||
          action.includes('effective immediately') ||
          action.includes('pa ') || // Public Act number
          action.includes('enrolled and presented to governor')) {
        console.log("DEBUG: Found specific final passage indicator in history:", action);
        return true;
      }
      
      // FIXED: Don't consider "resolution adopted" as passed for bills - only for actual resolutions
      if (action.includes('resolution adopted') && bill.title?.toLowerCase().includes('resolution')) {
        console.log("DEBUG: Found resolution adoption for actual resolution");
        return true;
      }
    }
  }
  
  console.log("DEBUG: No passage indicators found - bill has not passed");
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

/**
 * Extract the introduction date from the bill's history
 * Look for filing, introduction, or first reading actions
 */
function getIntroductionDate(bill: Bill): string | null {
  if (!bill.changes || bill.changes.length === 0) {
    return null;
  }
  
  // Sort changes by date to find the earliest
  const sortedChanges = [...bill.changes].sort((a, b) => {
    const dateA = parseDate(a.details || '');
    const dateB = parseDate(b.details || '');
    return dateA.getTime() - dateB.getTime();
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
    const dateA = parseDate(a.details || '');
    const dateB = parseDate(b.details || '');
    return dateB.getTime() - dateA.getTime();
  });
  
  const mostRecentAction = sortedChanges[0];
  return mostRecentAction?.details || bill.lastUpdated || null;
}

/**
 * Get a meaningful status description from the bill data
 */
function getStatusDescription(bill: Bill): string {
  // Try to get a meaningful status description
  const statusDesc = bill.data?.status_description || bill.data?.current_status_description;
  if (statusDesc && typeof statusDesc === 'string' && statusDesc !== bill.status) {
    return statusDesc;
  }
  
  // If we have a raw status number/code, try to make it more meaningful
  const rawStatus = bill.status || bill.data?.status || bill.data?.current_status;
  if (rawStatus) {
    // If it's just a number, try to provide context
    if (/^\d+$/.test(String(rawStatus))) {
      return `Status ${rawStatus} - In committee review`;
    }
    return String(rawStatus);
  }
  
  return 'Unknown status';
}

export async function analyzeBillPassChance(bill: Bill): Promise<PassChanceAnalysis | null> {
  try {
    console.log("Analyzing pass chance for bill:", bill.id);
    
    // First check if the bill has already passed - with improved logic
    const hasPassed = checkIfBillPassed(bill);
    console.log("DEBUG: Bill passed check result:", hasPassed);
    
    if (hasPassed) {
      console.log("Bill has already passed, returning passed status");
      
      // Determine the specific type of passage for more accurate messaging
      let passageType = "passed and been enacted into law";
      
      // Check for resolution adoption specifically
      const hasResolutionAdopted = bill.changes?.some(change => 
        String(change.description || '').toLowerCase().includes('resolution adopted')
      ) || String(bill.status || '').toLowerCase().includes('adopted');
      
      if (hasResolutionAdopted) {
        passageType = "been adopted as a resolution";
      }
      
      return {
        score: 5,
        reasoning: `This bill has already ${passageType} according to its legislative history.`,
        factors: [{
          factor: "bill_status",
          impact: "positive",
          description: `The bill has completed the legislative process and has ${passageType}.`
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
    
    // Extract dates using improved parsing
    const introductionDate = getIntroductionDate(bill);
    const lastActionDate = getLastActionDate(bill);
    
    // Get meaningful status description
    const currentStatus = getStatusDescription(bill);
    
    // CRITICAL FIX: Send the original bill.changes array directly without transformation
    // The billAnalyzer expects the exact format from the bill object
    const originalChanges = bill.changes || [];
    
    console.log("DEBUG: Sending original changes format to analyzer:", JSON.stringify(originalChanges.slice(0, 3), null, 2));
    
    // Extract committee progress
    const committeeActions = bill.data?.progress || bill.data?.committee_actions || bill.data?.history || [];
    
    console.log("Formatted sponsor info:", sponsorInfo);
    console.log("Formatted cosponsor info:", cosponsorInfo);
    console.log("Introduction date extracted:", introductionDate);
    console.log("Last action date extracted:", lastActionDate);
    console.log("Status description:", currentStatus);
    console.log("Original changes count:", originalChanges.length);
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
          introducedDate: introductionDate,
          lastActionDate: lastActionDate,
          lastUpdated: bill.lastUpdated,
          sessionName: bill.sessionName,
          sessionYear: bill.sessionYear,
          // CRITICAL: Send original changes array instead of transformed format
          changes: originalChanges,
          changesCount: originalChanges.length,
          committeeActions: committeeActions,
          passedBothHouses: passedBothHouses,
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
