
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface BillTextHashProps {
  textHash: string;
  billId: string;
}

const BillTextHash = ({ textHash, billId }: BillTextHashProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  
  // Automatically fetch the bill text when the component mounts
  useEffect(() => {
    fetchActualText();
  }, [billId]);
  
  if (!billId) return null;
  
  const fetchActualText = async () => {
    if (isLoading || textContent) return;
    
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
        {!textContent && isLoading && (
          <div className="flex items-center">
            <Spinner className="mr-2 h-4 w-4" />
            <span className="text-sm text-gray-500">Loading bill text...</span>
          </div>
        )}
      </div>
      
      {!textContent && !isLoading && (
        <div>
          <Button
            onClick={fetchActualText}
            disabled={isLoading}
            size="sm"
            className="mt-2"
          >
            {isLoading ? "Loading..." : "Load Bill Text"}
          </Button>
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
