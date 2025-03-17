
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PdfFallbackDisplayProps {
  content: string;
  externalUrl?: string | null;
}

const PdfFallbackDisplay = ({ content, externalUrl }: PdfFallbackDisplayProps) => {
  const handleExternalLinkClick = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("External URL is not available");
    }
  };
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
      <div className="flex items-start">
        <FileText className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
        <div>
          <div dangerouslySetInnerHTML={{ __html: content }} className="text-sm text-amber-800 whitespace-pre-line" />
          
          {externalUrl && (
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3 text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100"
              onClick={handleExternalLinkClick}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Original Document
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfFallbackDisplay;
