
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, AlertTriangle } from "lucide-react";
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
  
  // Check if this is likely from another state
  const isNotIllinoisBill = externalUrl && (
    !externalUrl.includes("ilga.gov") || 
    externalUrl.includes("legis.wisconsin.gov")
  );
  
  return (
    <div className={`border rounded-md p-4 ${isNotIllinoisBill ? "bg-amber-50 border-amber-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-start">
        <FileText className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
        <div>
          {isNotIllinoisBill && (
            <div className="mb-3 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <p className="font-medium">This appears to be a non-Illinois bill</p>
            </div>
          )}
          
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
