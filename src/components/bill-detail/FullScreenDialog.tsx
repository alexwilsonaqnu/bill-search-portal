
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minimize } from "lucide-react";
import PdfViewer from "./pdf/PdfViewer";
import ExtractedTextDisplay from "./pdf/ExtractedTextDisplay";
import PdfFallbackDisplay from "./pdf/PdfFallbackDisplay";
import TextContentDisplay from "./text/TextContentDisplay";

interface FullScreenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isPdfContent: boolean;
  pdfBase64: string | null;
  textContent: string | null;
  extractedText: string | null;
  isHtmlContent: boolean;
  externalUrl?: string | null;
  onTextExtracted?: (text: string) => void;
}

const FullScreenDialog = ({
  isOpen,
  onClose,
  title,
  isPdfContent,
  pdfBase64,
  textContent,
  extractedText,
  isHtmlContent,
  externalUrl,
  onTextExtracted
}: FullScreenDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="flex items-center gap-1"
          >
            <Minimize className="h-4 w-4" /> Exit Full Screen
          </Button>
        </div>

        {/* PDF Content in Full Screen */}
        {isPdfContent && pdfBase64 ? (
          <div className="h-[75vh] flex flex-col">
            <PdfViewer 
              pdfBase64={pdfBase64} 
              externalUrl={externalUrl} 
              onTextExtracted={onTextExtracted}
              isFullScreen={true}
            />
            
            {/* Display extracted text if available */}
            {extractedText && (
              <ExtractedTextDisplay text={extractedText} />
            )}
          </div>
        ) : isPdfContent && textContent ? (
          /* PDF Fallback Content in Full Screen */
          <div className="h-[75vh] overflow-auto">
            <PdfFallbackDisplay content={textContent} externalUrl={externalUrl} />
          </div>
        ) : (
          /* Regular Content in Full Screen */
          <TextContentDisplay 
            content={textContent || ""} 
            isHtml={isHtmlContent} 
            isFullScreen={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenDialog;
