
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Utility to search for a specific legislator and log detailed results
 */
export async function searchLegislatorDebug(name: string) {
  console.log(`Debugging search for legislator: "${name}"`);
  
  try {
    // Try multiple search approaches and log results
    const exactResults = await supabase
      .from('IL_legislators')
      .select('*')
      .eq('name', name);
      
    const ilikeResults = await supabase
      .from('IL_legislators')
      .select('*')
      .ilike('name', `%${name}%`);
      
    // Split name and try searching by parts
    const nameParts = name.trim().split(' ');
    let firstNameResults = null;
    let lastNameResults = null;
    
    if (nameParts.length > 1) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      firstNameResults = await supabase
        .from('IL_legislators')
        .select('*')
        .ilike('given_name', `%${firstName}%`);
        
      lastNameResults = await supabase
        .from('IL_legislators')
        .select('*')
        .ilike('family_name', `%${lastName}%`);
    }
    
    // Compile search results
    const searchResults = {
      name,
      exactMatch: {
        success: !exactResults.error,
        count: exactResults.data?.length || 0,
        data: exactResults.data,
        error: exactResults.error
      },
      partialMatch: {
        success: !ilikeResults.error,
        count: ilikeResults.data?.length || 0,
        data: ilikeResults.data,
        error: ilikeResults.error
      },
      firstNameMatch: firstNameResults ? {
        success: !firstNameResults.error,
        count: firstNameResults.data?.length || 0,
        data: firstNameResults.data,
        error: firstNameResults.error
      } : null,
      lastNameMatch: lastNameResults ? {
        success: !lastNameResults.error,
        count: lastNameResults.data?.length || 0,
        data: lastNameResults.data,
        error: lastNameResults.error
      } : null
    };
    
    console.log(`Search results for "${name}":`, searchResults);
    
    // Show toast with summary
    let foundAny = false;
    if (searchResults.exactMatch.count > 0) {
      toast({
        title: "Success",
        description: `Found exact match for "${name}"`,
        variant: "default"
      });
      foundAny = true;
    } else if (searchResults.partialMatch.count > 0) {
      toast({
        title: "Success",
        description: `Found ${searchResults.partialMatch.count} partial matches for "${name}"`,
        variant: "default"
      });
      foundAny = true;
    } else if (searchResults.lastNameMatch?.count > 0) {
      toast({
        title: "Success",
        description: `Found ${searchResults.lastNameMatch.count} matches by last name`,
        variant: "default"
      });
      foundAny = true;
    } else {
      toast({
        title: "Warning",
        description: `No legislators found matching "${name}"`,
        variant: "warning"
      });
    }
    
    return { success: true, foundAny, results: searchResults };
  } catch (error: any) {
    console.error("Error in legislator search debug:", error);
    toast({
      title: "Error",
      description: "Search debug operation failed",
      variant: "destructive"
    });
    return { success: false, error: error.message };
  }
}
