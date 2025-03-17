
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AlertCircle, Maximize, Minimize, FileText, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BillChat from "./BillChat";
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface BillTextHashProps {
  textHash: string;
  billId: string;
  externalUrl?: string | null;
}

const BillTextHash = ({ textHash, billId, externalUrl }: BillTextHashProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(true); // Default to showing full text
  const [error, setError] = useState<string | null>(null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPdfContent, setIsPdfContent] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  // Automatically fetch the bill text when the component mounts
  useEffect(() => {
    fetchActualText();
  }, [billId]);
  
  // When PDF document changes or current page changes, render the new page
  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, isFullScreen]);
  
  if (!billId) return null;
  
  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) return;
    
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      toast.error("Failed to render PDF page");
    }
  };
  
  const loadPdfFromBase64 = async (base64Data: string) => {
    try {
      // Remove the data URL prefix if present
      const pdfData = base64Data.includes('base64,') 
        ? atob(base64Data.split('base64,')[1])
        : atob(base64Data);
      
      // Convert binary string to array buffer
      const array = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        array[i] = pdfData.charCodeAt(i);
      }
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: array.buffer });
      const pdf = await loadingTask.promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      return pdf;
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF document");
      return null;
    }
  };
  
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
      
      // Check if content is PDF
      if (data.isPdf || data.mimeType === 'application/pdf') {
        setIsPdfContent(true);
        
        if (data.base64) {
          setPdfBase64(data.base64);
          await loadPdfFromBase64(data.base64);
          toast.success("PDF document loaded successfully");
        } else {
          // If no base64 data, display the fallback message
          setTextContent(data.text);
          setIsHtmlContent(true);
        }
        
        setIsLoading(false);
        return;
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
  
  // Navigation functions for PDF
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  // Truncate text for preview if needed
  const getDisplayText = () => {
    if (!textContent) return "";
    
    if (showFullText || textContent.length <= 500) {
      return textContent;
    }
    
    return textContent.substring(0, 500) + "...";
  };

  // Function to handle external URL opening
  const openExternalUrl = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("No external URL available for this bill");
    }
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
      
      {/* PDF Content Special Handling */}
      {isPdfContent && pdfBase64 && !isFullScreen && (
        <div className="mt-4 border rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="font-medium">PDF Document</span>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className="mr-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm mx-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="ml-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center bg-gray-100 p-2 rounded">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
          
          {externalUrl && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={openExternalUrl}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Original PDF
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* PDF Fallback Message */}
      {isPdfContent && !pdfBase64 && textContent && !isFullScreen && (
        <div className="mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-amber-600 mr-3 mt-1" />
              <div>
                <div dangerouslySetInnerHTML={{ __html: textContent }} className="text-sm text-amber-800 whitespace-pre-line" />
                
                {externalUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openExternalUrl}
                    className="mt-4 bg-white border-amber-300 text-amber-800 hover:bg-amber-100 flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View External Content
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Regular Content Display */}
      {textContent && !isPdfContent && !isFullScreen && (
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

          {/* PDF Content in Full Screen */}
          {isPdfContent && pdfBase64 ? (
            <div className="h-[75vh] flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">PDF Document</span>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 1}
                    className="mr-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm mx-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages}
                    className="ml-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto flex justify-center bg-gray-100 p-4 rounded">
                <canvas ref={canvasRef} className="max-h-full" />
              </div>
              
              {externalUrl && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openExternalUrl}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Original PDF
                  </Button>
                </div>
              )}
            </div>
          ) : isPdfContent && textContent ? (
            /* PDF Fallback Content in Full Screen */
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 h-[75vh] overflow-auto">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <div dangerouslySetInnerHTML={{ __html: textContent }} className="text-sm text-amber-800 whitespace-pre-line" />
                  
                  {externalUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openExternalUrl}
                      className="mt-6 bg-white border-amber-300 text-amber-800 hover:bg-amber-100 flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View External Content
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Regular Content in Full Screen */
            isHtmlContent ? (
              <div className="bg-gray-50 p-4 rounded-md text-sm overflow-auto h-[75vh] border">
                <div dangerouslySetInnerHTML={{ __html: textContent || "" }} />
              </div>
            ) : (
              <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto h-[75vh] border">
                {textContent}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Chat component - disabled for PDF content since it can't be analyzed properly */}
      {textContent && !isPdfContent && <BillChat billText={textContent} />}
    </div>
  );
};

export default BillTextHash;
