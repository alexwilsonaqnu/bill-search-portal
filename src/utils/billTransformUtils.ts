
import { Bill } from "@/types";

/**
 * Transforms a bill record from Supabase format to the application's Bill format
 */
export function transformSupabaseBill(item: any): Bill {
  // Handle the nested data JSON field that contains versions and changes
  const billData = typeof item.data === 'object' ? item.data : {};
  
  // Handle case where bill is nested inside a 'bill' property (as in the example JSON)
  const billObject = item.bill || item;
  
  // Ensure ID is a string
  const id = billObject.bill_id || billObject.id || "";
  const idString = id.toString();
  
  return {
    id: idString,
    title: billObject.title || "",
    description: billObject.description || "",
    status: billObject.status || "",
    lastUpdated: billObject.status_date ? new Date(billObject.status_date).toISOString().split('T')[0] : "",
    // Use nested data from the JSON or empty arrays if not present
    versions: Array.isArray(billData.versions) ? billData.versions : [],
    changes: Array.isArray(billData.changes) ? billData.changes : [],
    // Include the full data object for additional properties
    data: billData
  };
}

/**
 * Normalizes bill ID to a consistent string format
 * Also handles special cases like numeric IDs and memorial resolutions
 */
export function normalizeBillId(id: string | number): string {
  // Ensure it's a string
  const stringId = id.toString().trim();
  
  // Check if it's a numeric ID (possibly a memorial resolution)
  if (/^\d+$/.test(stringId)) {
    // For purely numeric IDs, preserve the numeric format
    // This is important for lookup consistency
    return stringId;
  }
  
  // For IDs with prefixes (HB, SB, etc.), return the normalized version
  // Remove any non-alphanumeric characters for consistency
  return stringId.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Transforms a bill from Supabase Storage format to the application's Bill format
 * Ensuring all available data is preserved and displayed
 */
export function transformStorageBill(fileName: string, fileContent: any): Bill {
  // Extract ID from filename (assuming format like "HB1234.json")
  const id = fileName.replace('.json', '');
  
  try {
    // Parse the JSON content if it's a string
    const parsedContent = typeof fileContent === 'string' 
      ? JSON.parse(fileContent) 
      : fileContent;
    
    // For numeric IDs (like memorial resolutions), handle special parsing
    const isNumeric = /^\d+$/.test(id);
    
    // Handle case where bill is nested inside a 'bill' property (as in the example JSON)
    const billObject = parsedContent.bill || parsedContent;
    
    // Ensure ID is a string
    const billId = billObject.bill_id || id;
    const idString = billId.toString();
    
    // Extract sections from the bill content
    const sections = [];
    
    // Basic bill info section
    sections.push({
      id: "basic-info",
      title: "Basic Information",
      content: JSON.stringify(
        {
          bill_id: billObject.bill_id,
          title: billObject.title,
          description: billObject.description,
          status: billObject.status,
          status_date: billObject.status_date
        }, 
        null, 
        2
      )
    });
    
    // Add sponsors section if available
    if (billObject.sponsors || billObject.sponsor) {
      sections.push({
        id: "sponsors",
        title: "Sponsors",
        content: JSON.stringify(
          billObject.sponsors || { primary: billObject.sponsor },
          null,
          2
        )
      });
    }
    
    // Add full data section
    sections.push({
      id: "full-data",
      title: "All Available Data",
      content: JSON.stringify(parsedContent, null, 2)
    });
    
    // Construct versions from texts or add a version with all sections
    const versions = Array.isArray(billObject.texts) 
      ? billObject.texts.map((text: any) => ({
          id: text.doc_id || `text-${Math.random().toString(36).substring(2, 9)}`,
          name: text.type || "Bill Text",
          status: "",
          date: text.date || "",
          sections: [{
            id: "s1",
            title: "Content",
            content: text.state_link || text.content || JSON.stringify(text, null, 2)
          }]
        })) 
      : [{
          id: "v1",
          name: "Bill Details",
          status: "",
          date: billObject.status_date || "",
          sections: sections
        }];
    
    // Construct changes from history or add placeholders
    const changes = billObject.history 
      ? billObject.history.map((item: any, index: number) => ({
          id: `c${index}`,
          description: item.action || "",
          details: item.date || ""
        })) 
      : [];
    
    return {
      id: idString,
      title: billObject.title || `Bill ${id}`,
      description: billObject.description || (typeof billObject.summary === 'string' ? billObject.summary : ""),
      status: billObject.status || billObject.status_date ? `Last updated: ${billObject.status_date}` : "",
      lastUpdated: billObject.status_date || "",
      versions: versions,
      changes: changes,
      // Include the full data object for additional properties
      data: parsedContent
    };
  } catch (error) {
    console.error(`Error parsing bill ${fileName}:`, error);
    // Return a minimal valid bill object if parsing fails
    return {
      id: id,
      title: `Bill ${id}`,
      description: "Error loading bill details",
      status: "",
      versions: [],
      changes: []
    };
  }
}
