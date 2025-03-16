
// Shared CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for request parameters
export interface RequestParams {
  action?: "process" | "upload" | "list";
  fileContent?: string;
  fileName?: string;
}
