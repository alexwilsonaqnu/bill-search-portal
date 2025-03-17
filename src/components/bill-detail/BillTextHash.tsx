
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AlertCircle, Maximize, Minimize } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BillChat from "./BillChat";

interface BillTextHashProps {
  textHash: string;
  billId: string;
}

const BillTextHash = ({ textHash, billId }: BillTextHashProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(true); // Default to showing full text
  const [error, setError] = useState<string | null>(null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Automatically fetch the bill text when the component mounts
  useEffect(() => {
    fetchActualText();
  }, [billId]);
  
  if (!billId) return null;
  
  const fetchActualText = async () => {
    if (isLoading || textContent) return;
    
    setIsLoading(true);
    setError(null);
    toast.info("Fetching bill text from Legiscan...");
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-bill-text', {
        body: { billId }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        const userMessage = data.userMessage || data.error;
        setError(userMessage);
        throw new Error(userMessage);
      }
      
      // Check if content is HTML by looking for HTML tags
      const isHtml = data.text.includes('<html') || 
                     data.text.includes('<meta') || 
                     data.text.includes('<style') || 
                     data.text.includes('<body');
      
      setIsHtmlContent(isHtml);
      setTextContent(data.text);
      toast.success("Bill text fetched successfully");
    } catch (error) {
      console.error("Error fetching bill text:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to fetch bill text: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to toggle full text display
  const toggleFullText = () => {
    setShowFullText(prev => !prev);
  };

  // Function to toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
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
    <div className="space-y-2 relative">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bill Text</h3>
        {!textContent && isLoading && (
          <div className="flex items-center">
            <Spinner className="mr-2 h-4 w-4" />
            <span className="text-sm text-gray-500">Loading bill text...</span>
          </div>
        )}
        {textContent && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullScreen}
            className="flex items-center gap-1"
          >
            {isFullScreen ? (
              <>
                <Minimize className="h-4 w-4" /> Exit Full Screen
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4" /> Full Screen
              </>
            )}
          </Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-2">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                The Legiscan API subscription may have expired. Please contact the administrator.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!textContent && !isLoading && !error && (
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
      
      {textContent && !isFullScreen && (
        <div className="mt-4">
          {isHtmlContent ? (
            <div className="bg-gray-50 p-4 rounded-md text-sm overflow-auto max-h-[600px] border">
              <div dangerouslySetInnerHTML={{ __html: getDisplayText() }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto max-h-[600px] border">
              {getDisplayText()}
            </div>
          )}
          
          {textContent.length > 500 && !showFullText && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2" 
              onClick={toggleFullText}
            >
              Show Full Text
            </Button>
          )}
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bill Text</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullScreen(false)}
              className="flex items-center gap-1"
            >
              <Minimize className="h-4 w-4" /> Exit Full Screen
            </Button>
          </div>
          {isHtmlContent ? (
            <div className="bg-gray-50 p-4 rounded-md text-sm overflow-auto h-[70vh] border">
              <div dangerouslySetInnerHTML={{ __html: textContent || "" }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto h-[70vh] border">
              {textContent}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat component */}
      {textContent && <BillChat billText={textContent} />}
    </div>
  );
};

export default BillTextHash;
