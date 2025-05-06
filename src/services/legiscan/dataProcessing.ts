
import { Bill } from "@/types";

/**
 * Transforms LegiScan API response to our Bill type
 */
export function processBillData(billData: any, id: string): Bill {
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
