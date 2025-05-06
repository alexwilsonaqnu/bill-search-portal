
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { toast } from "sonner";
import { processBillData } from "./dataProcessing";

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
