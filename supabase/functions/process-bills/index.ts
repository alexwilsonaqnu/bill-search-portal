
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, RequestParams } from "./cors.ts";
import { handleUpload } from "./uploadHandler.ts";
import { handleList } from "./listHandler.ts";
import { handleProcess } from "./processHandler.ts";
import { createSuccessResponse, createErrorResponse, initializeSupabase } from "./utils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const { supabaseUrl, supabaseKey } = initializeSupabase();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process request based on action
    const { data: params } = await req.json();
    const action = params?.action || "process";
    
    console.log(`Executing '${action}' action`);
    
    // Route to appropriate handler based on action
    switch (action) {
      case "upload":
        return await handleUpload(supabase, params as RequestParams);
      
      case "list":
        return await handleList(supabase);
      
      default: // "process" is the default action
        return await handleProcess(supabase);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
});
