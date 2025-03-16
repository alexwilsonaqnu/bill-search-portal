
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { transformSupabaseBill } from "@/utils/billTransformUtils";

/**
 * Fetches all bills from the Supabase database table
 */
export async function fetchBillsFromDatabase(): Promise<Bill[] | null> {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*');
    
    if (error) {
      console.warn(`Error fetching from bills table: ${error.message}`);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log(`Successfully fetched ${data.length} bills from Supabase table`);
      return data.map(item => transformSupabaseBill(item));
    }
    
    console.log("No bills found in database table");
    return [];
  } catch (error) {
    console.error("Error fetching bills from database:", error);
    return null;
  }
}

/**
 * Fetches a specific bill by ID from the Supabase database table
 */
export async function fetchBillByIdFromDatabase(id: string): Promise<Bill | null> {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.log(`Bill ${id} not found in database table: ${error.message}`);
      return null;
    }
    
    if (data) {
      console.log(`Found bill ${id} in database table`);
      return transformSupabaseBill(data);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching bill ${id} from database:`, error);
    return null;
  }
}
