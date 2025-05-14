
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
      .select('count(*)') 
      .limit(1)
      .single();
      
    if (tablesError) {
      console.error("Error checking table existence:", tablesError.message);
      toast({
        title: "Database error",
        description: "Unable to access legislators table",
        variant: "destructive"
      });
      return { success: false, error: tablesError.message };
    }
    
    // Get sample records if the table exists
    const { data: records, error: recordsError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(2);
      
    if (recordsError) {
      console.error("Error fetching sample records:", recordsError.message);
      toast({
        title: "Database error",
        description: "Could not fetch legislator records",
        variant: "destructive"
      });
      return { success: false, error: recordsError.message };
    }
    
    // Get table columns - using a safer approach
    let columns: any[] = [];
    try {
      const { data: columnData, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'IL_legislators' });
        
      if (!columnsError && columnData) {
        // Fix for error on line 49 - explicitly cast columnData to any[]
        columns = columnData as any[];
      } else {
        console.log("Could not fetch schema details:", columnsError?.message);
      }
    } catch (columnFetchError) {
      console.log("Error fetching columns:", columnFetchError);
    }
    
    // Parse count properly - tables might contain different structures based on the query
    // Fix for error on lines 66-67
    let recordCount = 0;
    if (tables !== null && typeof tables === 'object') {
      // Safe access to the count property with null check
      const count = tables.count;
      if (count !== null && count !== undefined) {
        recordCount = Number(count);
      }
    }
    
    // Prepare diagnostic info
    const diagnosticInfo = {
      success: true,
      count: recordCount,
      hasRecords: records && records.length > 0,
      sampleRecords: records,
      columns: columns || [],
      timestamp: new Date().toISOString()
    };
    
    console.log("IL_legislators table diagnostic results:", diagnosticInfo);
    
    if (diagnosticInfo.count === 0) {
      toast({
        title: "Warning",
        description: "The legislators table exists but contains no data",
        variant: "warning"
      });
    } else {
      toast({
        title: "Success",
        description: `Found ${diagnosticInfo.count} legislators in database`,
        variant: "default"
      });
    }
    
    return diagnosticInfo;
  } catch (error: any) {
    console.error("Unhandled error in diagnostic check:", error);
    toast({
      title: "Error",
      description: "Failed to complete database diagnostic check",
      variant: "destructive"
    });
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

// Export the utility functions
export const debugUtils = {
  checkLegislatorsTable,
  searchLegislatorDebug
};
