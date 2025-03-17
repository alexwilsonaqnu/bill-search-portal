
import { FileText } from "lucide-react";
import PdfViewer from "./PdfViewer";
import ExtractedTextDisplay from "./ExtractedTextDisplay";
import PdfFallbackDisplay from "./PdfFallbackDisplay";

interface PdfContentDisplayProps {
  pdfBase64: string | null;
  textContent: string | null;
  externalUrl?: string | null;
  extractedText: string | null;
  onTextExtracted: (text: string) => void;
  isFullScreen?: boolean;
}

const PdfContentDisplay = ({
  pdfBase64,
  textContent,
  externalUrl,
  extractedText,
  onTextExtracted,
  isFullScreen = false
}: PdfContentDisplayProps) => {
  if (isFullScreen) return null;
  
  return (
    <>
      {/* PDF Content Special Handling */}
      {pdfBase64 && (
        <div className="mt-4 border rounded-md p-4">
          <div className="flex items-center gap-1 mb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="font-medium">PDF Document</span>
          </div>
          
          <PdfViewer 
            pdfBase64={pdfBase64} 
            externalUrl={externalUrl} 
            onTextExtracted={onTextExtracted} 
          />
          
          {/* Display extracted text if available */}
          {extractedText && <ExtractedTextDisplay text={extractedText} />}
        </div>
      )}
      
      {/* PDF Fallback Message */}
      {!pdfBase64 && textContent && (
        <div className="mt-4">
          <PdfFallbackDisplay content={textContent} externalUrl={externalUrl} />
        </div>
      )}
    </>
  );
};

export default PdfContentDisplay;
