
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PdfFallbackDisplayProps {
  content: string;
  externalUrl?: string | null;
}

const PdfFallbackDisplay = ({ content, externalUrl }: PdfFallbackDisplayProps) => {
  const openExternalUrl = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("No external URL available for this bill");
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
  );
};

export default PdfFallbackDisplay;
