
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
      // Define parameter object with explicit any type to resolve the type error
      const params: Record<string, any> = { 
        table_name: 'IL_legislators' 
      };
      
      const { data: columnData, error: columnsError } = await supabase
        .rpc('get_table_columns', params);
        
      if (!columnsError && columnData) {
        columns = columnData as any[];
      } else {
        console.log("Could not fetch schema details:", columnsError?.message);
      }
    } catch (columnFetchError) {
      console.log("Error fetching columns:", columnFetchError);
    }
    
    // Parse count properly with thorough null checking
    let recordCount = 0;
    if (tables !== null && tables !== undefined) {
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
