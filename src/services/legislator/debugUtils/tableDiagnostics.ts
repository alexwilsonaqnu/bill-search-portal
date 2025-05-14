
import { supabase } from "@/integrations/supabase/client";

/**
 * Functions for diagnosing table issues
 */

/**
 * Check if the IL_legislators table exists and return its basic information
 */
export async function checkILLegislatorsTable() {
  console.log("Checking IL_legislators table existence and information");
  
  // First check if the table exists by querying the information schema
  try {
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'IL_legislators');
    
    if (tableError) {
      console.error("Error checking table existence:", tableError);
      return {
        exists: false,
        error: tableError.message,
        sample: null,
        columns: []
      };
    }
    
    const exists = tableExists && tableExists.length > 0;
    console.log(`IL_legislators table exists: ${exists}`);
    
    if (!exists) {
      return {
        exists: false,
        error: "Table does not exist",
        sample: null,
        columns: []
      };
    }
    
    // If table exists, get a sample record
    const { data: sampleData, error: sampleError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error("Error fetching sample data:", sampleError);
      return {
        exists: true,
        error: sampleError.message,
        sample: null,
        columns: []
      };
    }
    
    // Get table columns - using a safer approach with type casting
    let columns: any[] = [];
    try {
      // Use type assertion to bypass type checking for RPC calls
      const rpcCall = supabase.rpc(
        'get_table_columns' as any, 
        { table_name: 'IL_legislators' } as any
      ) as any;
      
      const { data: columnData, error: columnsError } = await rpcCall;
        
      if (!columnsError && columnData) {
        columns = columnData as any[];
      } else if (columnsError) {
        console.error("Error getting columns:", columnsError);
      }
    } catch (error) {
      console.error("RPC call to get_table_columns failed:", error);
      
      // Fallback: Extract column names from the sample record
      if (sampleData && sampleData.length > 0) {
        columns = Object.keys(sampleData[0]).map(name => ({ column_name: name }));
      }
    }
    
    return {
      exists: true,
      error: null,
      sample: sampleData && sampleData.length > 0 ? sampleData[0] : null,
      columns
    };
    
  } catch (error) {
    console.error("Unexpected error checking table:", error);
    return {
      exists: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      sample: null,
      columns: []
    };
  }
}
