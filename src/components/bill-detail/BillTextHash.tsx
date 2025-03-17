
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface BillTextHashProps {
  textHash: string;
  billId: string;
}

const BillTextHash = ({ textHash, billId }: BillTextHashProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  
  if (!textHash) return null;
  
  const fetchActualText = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast.info("Fetching bill text from Legiscan...");
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-bill-text', {
        body: { billId }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`API error: ${data.error}`);
      }
      
      setTextContent(data.text);
      toast.success("Bill text fetched successfully");
    } catch (error) {
      console.error("Error fetching bill text:", error);
      toast.error(`Failed to fetch bill text: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to toggle full text display
  const toggleFullText = () => {
    setShowFullText(prev => !prev);
  };
  
  // Truncate text for preview if needed
  const getDisplayText = () => {
    if (!textContent) return "";
    
    if (showFullText || textContent.length <= 500) {
      return textContent;
    }
    
    return textContent.substring(0, 500) + "...";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bill Text</h3>
        {!textContent && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchActualText}
            disabled={isLoading}
          >
            {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Fetch Actual Text
          </Button>
        )}
      </div>
      
      {!textContent && (
        <div>
          <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded border">
            {textHash}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This is the MD5 hash of the bill's text content. Use the button above to fetch and display the actual text.
          </p>
        </div>
      )}
      
      {textContent && (
        <div className="mt-4">
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto max-h-[400px] border">
            {getDisplayText()}
          </div>
          
          {textContent.length > 500 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2" 
              onClick={toggleFullText}
            >
              {showFullText ? "Show Less" : "Show Full Text"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BillTextHash;
