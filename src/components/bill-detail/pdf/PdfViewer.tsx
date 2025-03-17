
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { loadPdfFromBase64, renderPdfPage } from "./pdfUtils";
import PdfNavigation from "./PdfNavigation";
import PdfTextExtractor from "./PdfTextExtractor";

interface PdfViewerProps {
  pdfBase64: string;
  externalUrl?: string | null;
  onTextExtracted?: (text: string) => void;
  isFullScreen?: boolean;
}

const PdfViewer = ({ pdfBase64, externalUrl, onTextExtracted, isFullScreen = false }: PdfViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const initializePdf = async () => {
      const pdf = await loadPdfFromBase64(pdfBase64);
      if (pdf) {
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      }
    };
    
    initializePdf();
  }, [pdfBase64]);
  
  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPdfPage(pdfDocument, currentPage, canvasRef.current);
    }
  }, [pdfDocument, currentPage, isFullScreen]);
  
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
  
  const openExternalUrl = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("No external URL available for this bill");
    }
  };
  
  const handleTextExtracted = (text: string) => {
    if (onTextExtracted) {
      onTextExtracted(text);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <span className="font-medium">PDF Document</span>
        </div>
        <PdfNavigation 
          currentPage={currentPage}
          totalPages={totalPages}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
      </div>
      
      <div className={`flex justify-center bg-gray-100 p-2 rounded ${isFullScreen ? 'flex-1 overflow-auto' : ''}`}>
        <canvas ref={canvasRef} className={isFullScreen ? "max-h-full" : "max-w-full"} />
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <PdfTextExtractor 
          pdfDocument={pdfDocument}
          pdfBase64={pdfBase64}
          onTextExtracted={handleTextExtracted}
        />
        
        {externalUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={openExternalUrl}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Original PDF
          </Button>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
