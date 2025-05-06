
import { supabase } from "@/integrations/supabase/client";
import { BillVersion } from "@/types";

/**
 * Fetches bill versions from LegiScan
 */
export async function fetchBillVersions(billId: string): Promise<BillVersion[]> {
  try {
    console.log(`Fetching versions for bill ${billId} from LegiScan`);
    
    const { data, error } = await supabase.functions.invoke('get-bill-versions', {
      body: { billId }
    });
    
    if (error) {
      console.error(`Error fetching bill versions for ${billId}:`, error);
      return [];
    }
    
    if (!data || !data.versions || !Array.isArray(data.versions)) {
      console.warn(`No versions found for bill ${billId}`);
      return [];
    }
    
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
        content: version.content || ""
      }]
    }));
  } catch (error) {
    console.error(`Error in fetchBillVersions ${billId}:`, error);
    return [];
  }
}
