
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
