
import { supabase } from "@/integrations/supabase/client";
import { Change } from "@/types";

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
