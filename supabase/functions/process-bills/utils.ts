
import { corsHeaders } from "./cors.ts";

// Create a success response
export function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Create an error response
export function createErrorResponse(error: Error, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Error:", message);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Initialize Supabase client with environment variables
export function initializeSupabase() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return { supabaseUrl, supabaseKey };
}
