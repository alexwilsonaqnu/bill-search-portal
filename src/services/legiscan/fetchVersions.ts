
import { supabase } from "@/integrations/supabase/client";
import { BillVersion } from "@/types";
import { toast } from "sonner";

/**
 * Fetches bill versions from LegiScan
 */
export async function fetchBillVersions(billId: string, state: string = 'IL'): Promise<BillVersion[]> {
  try {
    console.log(`Fetching versions for bill ${billId} from LegiScan (state: ${state})`);
    
    // Set a reasonable timeout for the API call
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after 10 seconds")), 10000)
    );
    
    const fetchPromise = supabase.functions.invoke('get-bill-versions', {
      body: { 
        billId,
        state 
      }
    });
    
    // Use Promise.race to handle timeouts
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data, error } = result || {};
    
    if (error) {
      console.error(`Error fetching bill versions for ${billId}:`, error);
      toast.error("Failed to load bill versions");
      return [];
    }
    
    if (!data || !data.versions || !Array.isArray(data.versions)) {
      console.warn(`No versions found for bill ${billId}`);
      return [];
    }
    
    console.log(`Successfully fetched ${data.versions.length} versions for bill ${billId}`);
    
    // Transform the versions data into our BillVersion type
    return data.versions.map((version: any, index: number) => ({
      id: version.doc_id || `version-${index}`,
      name: version.type || `Version ${index + 1}`,
      status: version.state || "Unknown",
      date: version.date || "",
      sections: version.sections?.map((section: any, secIndex: number) => ({
        id: `section-${secIndex}`,
        title: section.title || `Section ${secIndex + 1}`,
        content: section.content || ""
      })) || [{
        id: "section-default",
        title: "Full text",
        content: version.content || "No content available for this version."
      }]
    }));
  } catch (error) {
    console.error(`Error in fetchBillVersions ${billId}:`, error);
    toast.error("Error loading bill versions");
    return [];
  }
}
