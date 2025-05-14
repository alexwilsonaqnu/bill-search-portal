
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the IL_legislators table has data and appropriate columns
 * This is useful for debugging database issues
 */
export async function checkILLegislatorsTable() {
  console.log("Checking IL_legislators table...");
  
  try {
    // Check if table exists
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_tables');
      
    if (tablesError) {
      console.error("Error checking tables:", tablesError.message);
      return {
        exists: false,
        error: tablesError.message,
        record_count: 0,
        columns: []
      };
    }
    
    // Convert table names to lowercase for case-insensitive comparison
    const tables = tablesData as any[] || [];
    const tableExists = tables.some(
      table => table.table_name?.toLowerCase() === 'il_legislators'
    );
    
    console.log(`IL_legislators table exists: ${tableExists}`);
    console.log(`Found ${tables.length} tables in the database`);
    
    if (!tableExists) {
      return {
        exists: false,
        error: "Table IL_legislators not found",
        record_count: 0,
        columns: []
      };
    }
    
    // Check columns in the table
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_columns', { table_name: 'IL_legislators' });
      
    if (columnsError) {
      console.error("Error checking columns:", columnsError.message);
      return {
        exists: true,
        error: columnsError.message,
        record_count: 0,
        columns: []
      };
    }
    
    // Count records in the table
    const { data: countData, error: countError } = await supabase
      .from('IL_legislators')
      .select('id', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error counting records:", countError.message);
      return {
        exists: true,
        error: countError.message,
        record_count: 0,
        columns: columnsData ? columnsData.map((col: any) => col.column_name) : []
      };
    }
    
    return {
      exists: true,
      error: null,
      record_count: countData ? (countData as any).count : 0,
      columns: columnsData ? columnsData.map((col: any) => col.column_name) : []
    };
  } catch (error) {
    console.error("Exception in checkILLegislatorsTable:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error),
      record_count: 0,
      columns: []
    };
  }
}
