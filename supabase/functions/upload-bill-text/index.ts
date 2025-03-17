
// Upload and process bill text content

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with Deno's env variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables for Supabase connection');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { billId, textContent, format = 'text' } = await req.json();
    
    if (!billId || !textContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: billId or textContent' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log(`Processing text content for bill: ${billId}`);
    
    // Look for the bill in the database
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();
      
    if (billError) {
      console.log(`Bill ${billId} not found in database, creating new record`);
      
      // Bill not found, create a basic record
      const newBill = {
        id: billId,
        title: `Bill ${billId}`,
        description: '',
        status: '',
        data: {
          text_content: textContent,
          text_format: format,
          upload_date: new Date().toISOString()
        }
      };
      
      const { error: insertError } = await supabase
        .from('bills')
        .upsert(newBill);
        
      if (insertError) {
        throw new Error(`Failed to insert bill: ${insertError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Created new bill record with text content`,
          billId
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Bill exists, update it with text content
    console.log(`Updating bill ${billId} with text content`);
    
    // Prepare the data update
    const updatedData = {
      ...billData.data,
      text_content: textContent,
      text_format: format,
      update_date: new Date().toISOString()
    };
    
    // Update the bill
    const { error: updateError } = await supabase
      .from('bills')
      .update({ data: updatedData })
      .eq('id', billId);
      
    if (updateError) {
      throw new Error(`Failed to update bill: ${updateError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated bill ${billId} with text content`,
        billId
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in upload-bill-text function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
