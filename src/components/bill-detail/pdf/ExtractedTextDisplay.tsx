
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";

interface ExtractedTextDisplayProps {
  text: string;
}

const ExtractedTextDisplay = ({ text }: ExtractedTextDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  
  const displayText = isExpanded ? text : text.slice(0, 500) + (text.length > 500 ? "..." : "");
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast.success("Text copied to clipboard");
  };
  
  return (
    <div className="mt-4 p-4 bg-gray-50 border rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Extracted Text:</h4>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard} 
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" /> Copy
          </Button>
          {text.length > 500 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {isExpanded ? "Show Less" : "Show More"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[500px] leading-relaxed">
        {displayText}
      </div>
    </div>
  );
};

export default ExtractedTextDisplay;
