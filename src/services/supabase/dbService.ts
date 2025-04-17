
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { transformSupabaseBill } from "@/utils/billTransformUtils";

/**
 * Fetches bills from the Supabase database table with pagination
 */
export async function fetchBillsFromDatabase(page = 1, pageSize = 10): Promise<{ tableData: Bill[] | null; totalCount: number }> {
  try {
    // First get the total count
    const { count, error: countError } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.warn(`Error counting bills: ${countError.message}`);
      return { tableData: null, totalCount: 0 };
    }
    
    const totalCount = count || 0;
    
    // Calculate pagination values
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Now get the paginated data
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('last_updated', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.warn(`Error fetching from bills table: ${error.message}`);
      return { tableData: null, totalCount };
    }
    
    if (data && data.length > 0) {
      console.log(`Successfully fetched ${data.length} bills from Supabase table (page ${page})`);
      return { 
        tableData: data.map(item => transformSupabaseBill(item)),
        totalCount
      };
    }
    
    console.log("No bills found in database table");
    return { tableData: [], totalCount };
  } catch (error) {
    console.error("Error fetching bills from database:", error);
    return { tableData: null, totalCount: 0 };
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
