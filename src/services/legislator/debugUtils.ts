
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Utility function to check the legislators table and report diagnostic information
 */
export async function checkLegislatorsTable() {
  console.log("Running diagnostic check on IL_legislators table...");
  
  try {
    // Check if the table exists
    const { data: tables, error: tablesError } = await supabase
      .from('IL_legislators')
      .select('count(*)', { count: 'exact', head: true });
      
    if (tablesError) {
      console.error("Error checking table existence:", tablesError.message);
      toast.error("Database error: Unable to access legislators table");
      return { success: false, error: tablesError.message };
    }
    
    // Get sample records if the table exists
    const { data: records, error: recordsError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(2);
      
    if (recordsError) {
      console.error("Error fetching sample records:", recordsError.message);
      toast.error("Database error: Could not fetch legislator records");
      return { success: false, error: recordsError.message };
    }
    
    // Get table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'IL_legislators' });
      
    if (columnsError) {
      console.log("Could not fetch schema details:", columnsError.message);
    }
    
    // Prepare diagnostic info
    const diagnosticInfo = {
      success: true,
      count: tables?.count || 0,
      hasRecords: records && records.length > 0,
      sampleRecords: records,
      columns: columns || [],
      timestamp: new Date().toISOString()
    };
    
    console.log("IL_legislators table diagnostic results:", diagnosticInfo);
    
    if (diagnosticInfo.count === 0) {
      toast.warning("The legislators table exists but contains no data");
    } else {
      toast.success(`Found ${diagnosticInfo.count} legislators in database`);
    }
    
    return diagnosticInfo;
  } catch (error) {
    console.error("Unhandled error in diagnostic check:", error);
    toast.error("Failed to complete database diagnostic check");
    return { success: false, error: error.message };
  }
}

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
      toast.success(`Found exact match for "${name}"`);
      foundAny = true;
    } else if (searchResults.partialMatch.count > 0) {
      toast.success(`Found ${searchResults.partialMatch.count} partial matches for "${name}"`);
      foundAny = true;
    } else if (searchResults.lastNameMatch?.count > 0) {
      toast.success(`Found ${searchResults.lastNameMatch.count} matches by last name`);
      foundAny = true;
    } else {
      toast.warning(`No legislators found matching "${name}"`);
    }
    
    return { success: true, foundAny, results: searchResults };
  } catch (error) {
    console.error("Error in legislator search debug:", error);
    toast.error("Search debug operation failed");
    return { success: false, error: error.message };
  }
}

// Export the utility functions
export const debugUtils = {
  checkLegislatorsTable,
  searchLegislatorDebug
};
