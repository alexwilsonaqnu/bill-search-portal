
import { Bill } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformSupabaseBill } from "@/utils/billTransformUtils";
import { FALLBACK_BILLS } from "@/data/fallbackBills";

/**
 * Fetches all bills from Supabase
 */
export async function fetchBillsFromSupabase() {
  try {
    console.log("Fetching bills from Supabase...");
    
    const { data, error } = await supabase
      .from('bills')
      .select('*');
    
    if (error) {
      console.warn(`Supabase fetch failed: ${error.message}`);
      toast.info("Using demo data - Supabase data not available");
      return null;
    }
    
    // Transform the data from Supabase format to our app's Bill format
    if (data && data.length > 0) {
      console.log(`Successfully fetched ${data.length} bills from Supabase`);
      
      const transformedBills: Bill[] = data.map(item => transformSupabaseBill(item));
      return transformedBills;
    }
    
    console.log("No bills found in Supabase");
    return [];
  } catch (error) {
    console.error("Error fetching bills:", error);
    return null;
  }
}

/**
 * Fetches a specific bill by ID from Supabase
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Fetching bill ${id} from Supabase...`);
    
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.warn(`Supabase fetch failed: ${error.message}`);
      return null;
    }
    
    if (!data) {
      console.warn(`Bill ${id} not found in Supabase`);
      return null;
    }
    
    // Transform the Supabase data to our app's Bill format
    return transformSupabaseBill(data);
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    return null;
  }
}
