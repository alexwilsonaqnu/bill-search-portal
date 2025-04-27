
import { supabase } from "@/integrations/supabase/client";
import { Bill, BillVersion, Change } from "@/types";
import { toast } from "sonner";

/**
 * Fetches a bill from LegiScan by ID
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    if (!id) {
      throw new Error("Bill ID is required");
    }
    
    console.log(`Fetching bill with ID from LegiScan: ${id}`);
    
    const { data, error } = await supabase.functions.invoke('get-bill', {
      body: { billId: id }
    });
    
    if (error) {
      console.error(`Error fetching bill ${id}:`, error);
      toast.error(`Error fetching bill ${id}`);
      return null;
    }
    
    if (!data || !data.bill) {
      console.warn(`Bill ${id} not found in LegiScan API`);
      return null;
    }
    
    // Process the bill data into our standard format
    const processedBill = processBillData(data.bill, id);
    
    // Save to localStorage as a fallback mechanism
    try {
      localStorage.setItem(`bill_${id}`, JSON.stringify(processedBill));
    } catch (e) {
      console.warn("Failed to cache bill in localStorage:", e);
    }
    
    return processedBill;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    return null;
  }
}

/**
 * Fetches bill history from LegiScan
 */
export async function fetchBillHistory(billId: string): Promise<Change[]> {
  try {
    console.log(`Fetching history for bill ${billId} from LegiScan`);
    
    const { data, error } = await supabase.functions.invoke('get-bill-history', {
      body: { billId }
    });
    
    if (error) {
      console.error(`Error fetching bill history for ${billId}:`, error);
      return [];
    }
    
    if (!data || !data.history || !Array.isArray(data.history)) {
      console.warn(`No history found for bill ${billId}`);
      return [];
    }
    
    // Transform the history data into our Change type
    return data.history.map((item: any, index: number) => ({
      id: `history-${index}`,
      description: item.action || "Unknown action",
      details: item.date || ""
    }));
  } catch (error) {
    console.error(`Error in fetchBillHistory ${billId}:`, error);
    return [];
  }
}

/**
 * Fetches bill text content from LegiScan
 */
export async function fetchBillText(billId: string) {
  try {
    console.log(`Invoking fetch-bill-text function with billId: ${billId}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-bill-text', {
      body: { billId }
    });
    
    if (error) {
      console.error(`Error invoking fetch-bill-text:`, error);
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data.error) {
      console.error(`fetch-bill-text returned error:`, data);
      const userMessage = data.userMessage || data.error;
      throw new Error(userMessage);
    }
    
    console.log(`fetch-bill-text successful response:`, data);
    
    return {
      isPdf: data.isPdf || data.mimeType === 'application/pdf',
      base64: data.base64,
      text: data.text,
      mimeType: data.mimeType,
      title: data.title,
      url: data.url
    };
  } catch (error) {
    console.error("Error fetching bill text:", error);
    throw error;
  }
}

/**
 * Fetches bill versions from LegiScan
 */
export async function fetchBillVersions(billId: string): Promise<BillVersion[]> {
  try {
    console.log(`Fetching versions for bill ${billId} from LegiScan`);
    
    const { data, error } = await supabase.functions.invoke('get-bill-versions', {
      body: { billId }
    });
    
    if (error) {
      console.error(`Error fetching bill versions for ${billId}:`, error);
      return [];
    }
    
    if (!data || !data.versions || !Array.isArray(data.versions)) {
      console.warn(`No versions found for bill ${billId}`);
      return [];
    }
    
    // Transform the versions data into our BillVersion type
    return data.versions.map((version: any, index: number) => ({
      id: version.doc_id || `version-${index}`,
      name: version.type || `Version ${index + 1}`,
      status: version.state || "Unknown",
      date: version.date || "",
      sections: version.sections?.map((section: any, secIndex: number) => ({
        id: `section-${secIndex}`,
        title: section.title || `Section ${secIndex + 1}`,
        content: section.content || ""
      })) || [{
        id: "section-default",
        title: "Full text",
        content: version.content || ""
      }]
    }));
  } catch (error) {
    console.error(`Error in fetchBillVersions ${billId}:`, error);
    return [];
  }
}

/**
 * Transforms LegiScan API response to our Bill type
 */
function processBillData(billData: any, id: string): Bill {
  // Extract basic bill information
  const bill: Bill = {
    id: id,
    title: billData.title || `Bill ${id}`,
    description: billData.description || billData.title || "",
    status: billData.status || "",
    lastUpdated: billData.last_action_date || "",
    sessionName: billData.session?.session_name || "Unknown Session",
    sessionYear: billData.session?.year_start || "",
    versions: [],
    changes: [],
    data: billData
  };
  
  // Process bill versions
  if (billData.texts && Array.isArray(billData.texts) && billData.texts.length > 0) {
    bill.versions = billData.texts.map((text: any, index: number) => ({
      id: text.doc_id || `version-${index}`,
      name: text.type || `Version ${index + 1}`,
      status: billData.status || "Unknown",
      date: text.date || "",
      sections: [{
        id: `section-${index}`,
        title: "Full text",
        content: text.text_content || ""
      }]
    }));
  }
  
  // Process history/changes
  if (billData.history && Array.isArray(billData.history)) {
    bill.changes = billData.history.map((historyItem: any, index: number) => ({
      id: `history-${index}`,
      description: historyItem.action || "Unknown action",
      details: historyItem.date || ""
    }));
  } else if (billData.progress && Array.isArray(billData.progress)) {
    bill.changes = billData.progress.map((progressItem: any, index: number) => ({
      id: `progress-${index}`,
      description: progressItem.event || "Unknown event",
      details: progressItem.date || ""
    }));
  }
  
  return bill;
}
