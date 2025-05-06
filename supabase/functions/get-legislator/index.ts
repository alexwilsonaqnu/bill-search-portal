
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from "./handlers.ts";
import { corsHeaders } from "./utils.ts";

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
};

// Main function to serve requests
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timeout after 8 seconds"));
      }, 8000);
    });

    // Race the actual request against the timeout
    return await Promise.race([
      handleRequest(req),
      timeoutPromise
    ]);
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message || "Unknown error",
        success: false
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
