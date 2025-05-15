
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
      setTimeout(() => reject(new Error("Request timed out after 15 seconds")), 15000)
    );
    
    const fetchPromise = supabase.functions.invoke('get-bill-versions', {
      body: { 
        billId,
        state,
        includeText: true // Explicitly request full text content
      }
    });
    
    // Use Promise.race to handle timeouts
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data, error } = result || {};
    
    if (error) {
      const errorMessage = error.message || "Unknown error";
      console.error(`Error fetching bill versions for ${billId} (${state}):`, error);
      toast.error(`Failed to load bill versions: ${errorMessage}`);
      return [];
    }
    
    if (!data || !data.versions || !Array.isArray(data.versions)) {
      console.warn(`No versions found for bill ${billId} (${state})`);
      return [];
    }
    
    console.log(`Successfully fetched ${data.versions.length} versions for bill ${billId} (${state})`);
    
    // Check if versions have content
    const versionsWithContent = data.versions.filter((v: any) => {
      const hasContent = v.sections && v.sections.some((s: any) => s.content && s.content.length > 0);
      return hasContent;
    }).length;
    
    console.log(`${versionsWithContent} of ${data.versions.length} versions have content`);
    
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in fetchBillVersions for bill ${billId} (${state}):`, error);
    toast.error(`Error loading bill versions: ${errorMessage}`);
    return [];
  }
}
