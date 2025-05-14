
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils.ts";
import { handleRequest } from "./handlers.ts";
import "./persistentCache.ts"; // This initializes the persistent cache

console.log("Starting get-legislator function");

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Received request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Handle the request
    return await handleRequest(req);
  } catch (error) {
    console.error("Unhandled error in get-legislator function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
