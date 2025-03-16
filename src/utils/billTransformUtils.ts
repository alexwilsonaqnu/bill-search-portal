
import { Bill } from "@/types";

/**
 * Transforms a bill record from Supabase format to the application's Bill format
 */
export function transformSupabaseBill(item: any): Bill {
  // Handle the nested data JSON field that contains versions and changes
  const billData = typeof item.data === 'object' ? item.data : {};
  
  return {
    id: item.id,
    title: item.title,
    description: item.description || "",
    status: item.status || "",
    lastUpdated: item.last_updated ? new Date(item.last_updated).toISOString().split('T')[0] : "",
    // Use nested data from the JSON or empty arrays if not present
    versions: Array.isArray(billData.versions) ? billData.versions : [],
    changes: Array.isArray(billData.changes) ? billData.changes : []
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
    const billData = typeof fileContent === 'string' 
      ? JSON.parse(fileContent) 
      : fileContent;
    
    return {
      id: id,
      title: billData.title || `Bill ${id}`,
      description: billData.description || "",
      status: billData.status || "",
      lastUpdated: billData.lastUpdated || "",
      versions: Array.isArray(billData.versions) ? billData.versions : [],
      changes: Array.isArray(billData.changes) ? billData.changes : []
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
