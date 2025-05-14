
import { supabase } from "@/integrations/supabase/client";

/**
 * Check the IL_legislators table in the database
 * Returns diagnostics about the table structure and data
 */
export async function checkILLegislatorsTable() {
  try {
    console.log("Running diagnostics on IL_legislators table...");
    
    // First check if the table exists
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('check_table_exists', { table_name: 'il_legislators' });
    
    if (tablesError) {
      console.error("Error checking if table exists:", tablesError);
      return {
        exists: false,
        error: tablesError.message,
        columnCount: 0,
        rowCount: 0,
        sampleData: null
      };
    }
    
    console.log("Table exists check result:", tablesData);
    
    if (!tablesData || tablesData.length === 0 || !tablesData[0].exists) {
      return {
        exists: false,
        error: "Table does not exist",
        columnCount: 0,
        rowCount: 0,
        sampleData: null
      };
    }
    
    // Get column information
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'il_legislators' });
    
    if (columnsError) {
      console.error("Error getting table columns:", columnsError);
      return {
        exists: true,
        error: columnsError.message,
        columnCount: 0,
        rowCount: 0,
        sampleData: null
      };
    }
    
    // Get row count
    const { count, error: countError } = await supabase
      .from('il_legislators')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting rows:", countError);
      return {
        exists: true,
        columns: columnsData,
        columnCount: columnsData?.length || 0,
        error: countError.message,
        rowCount: 0,
        sampleData: null
      };
    }
    
    // Get a sample row
    const { data: sampleData, error: sampleError } = await supabase
      .from('il_legislators')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error("Error getting sample data:", sampleError);
      return {
        exists: true,
        columns: columnsData,
        columnCount: columnsData?.length || 0,
        rowCount: count || 0,
        error: sampleError.message,
        sampleData: null
      };
    }
    
    return {
      exists: true,
      columns: columnsData,
      columnCount: columnsData?.length || 0,
      rowCount: count || 0,
      sampleData: sampleData && sampleData.length > 0 ? sampleData[0] : null,
      error: null
    };
    
  } catch (error) {
    console.error("Exception in checkILLegislatorsTable:", error);
    return {
      exists: false,
      error: error.message,
      columnCount: 0,
      rowCount: 0,
      sampleData: null
    };
  }
}
