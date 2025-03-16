
import { Bill } from "@/types";

/**
 * Transforms a bill record from Supabase format to the application's Bill format
 */
export function transformSupabaseBill(item: any): Bill {
  // Handle the nested data JSON field that contains versions and changes
  const billData = typeof item.data === 'object' ? item.data : {};
  
  // Handle case where bill is nested inside a 'bill' property (as in the example JSON)
  const billObject = item.bill || item;
  
  return {
    id: billObject.bill_id || billObject.id || "",
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
 * Transforms a bill from Supabase Storage format to the application's Bill format
 */
export function transformStorageBill(fileName: string, fileContent: any): Bill {
  // Extract ID from filename (assuming format like "HB1234.json")
  const id = fileName.replace('.json', '');
  
  try {
    // Parse the JSON content if it's a string
    const parsedContent = typeof fileContent === 'string' 
      ? JSON.parse(fileContent) 
      : fileContent;
    
    // Handle case where bill is nested inside a 'bill' property (as in the example JSON)
    const billObject = parsedContent.bill || parsedContent;
    
    return {
      id: billObject.bill_id || id,
      title: billObject.title || `Bill ${id}`,
      description: billObject.description || "",
      status: billObject.status_date ? `Last updated: ${billObject.status_date}` : "",
      lastUpdated: billObject.status_date || "",
      versions: Array.isArray(billObject.texts) 
        ? billObject.texts.map((text: any) => ({
            id: text.doc_id || "",
            name: text.type || "",
            status: "",
            date: text.date || "",
            sections: [{
              id: "s1",
              title: "Content",
              content: text.state_link || ""
            }]
          })) 
        : [],
      changes: billObject.history 
        ? billObject.history.map((item: any, index: number) => ({
            id: `c${index}`,
            description: item.action || "",
            details: item.date || ""
          })) 
        : [],
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
