
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to check the IL_legislators table structure and data
 */
export async function checkILLegislatorsTable() {
  console.log("🔍 Diagnosing IL_legislators table...");
  
  try {
    // Check if table exists
    const { data: tableData, error: tableError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("❌ Error accessing IL_legislators table:", tableError.message);
      return {
        exists: false,
        error: tableError.message,
        records: 0,
        sample: null
      };
    }
    
    // Count total records
    const { count, error: countError } = await supabase
      .from('IL_legislators')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("❌ Error counting records:", countError.message);
      return {
        exists: true,
        error: countError.message,
        records: 'unknown',
        sample: tableData && tableData.length > 0 ? tableData[0] : null
      };
    }
    
    // Get a few sample records
    const { data: sampleData, error: sampleError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error("❌ Error fetching sample data:", sampleError.message);
      return {
        exists: true,
        records: count,
        error: sampleError.message,
        sample: null
      };
    }
    
    // Extract column names from first record
    const columnNames = sampleData && sampleData.length > 0 
      ? Object.keys(sampleData[0]) 
      : [];
    
    // Get values for a specific set of important columns
    const importantColumns = ['id', 'name', 'current_party', 'current_district', 'email'];
    const columnSamples = sampleData && sampleData.length > 0 
      ? importantColumns.map(col => ({
          column: col,
          present: columnNames.includes(col),
          sample: sampleData[0][col]
        }))
      : [];
    
    console.log(`✅ IL_legislators table exists with ${count} records`);
    console.log("📊 Column samples:", columnSamples);
    
    return {
      exists: true,
      records: count,
      columns: columnNames,
      columnSamples,
      sample: sampleData && sampleData.length > 0 ? sampleData[0] : null,
      sampleRecords: sampleData
    };
  } catch (error) {
    console.error("❌ Unexpected error during table diagnosis:", error);
    return {
      exists: false,
      error: error.message,
      records: 0,
      sample: null
    };
  }
}
