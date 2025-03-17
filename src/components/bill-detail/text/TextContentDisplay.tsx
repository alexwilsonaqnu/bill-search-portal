
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TextContentDisplayProps {
  content: string;
  isHtml: boolean;
}

const TextContentDisplay = ({ content, isHtml }: TextContentDisplayProps) => {
  const [showFullText, setShowFullText] = useState(true);
  
  // Function to toggle full text display
  const toggleFullText = () => {
    setShowFullText(prev => !prev);
  };
  
  // Truncate text for preview if needed
  const getDisplayText = () => {
    if (!content) return "";
    
    if (showFullText || content.length <= 500) {
      return content;
    }
    
    return content.substring(0, 500) + "...";
  };
  
  return (
    <div className="mt-4">
      {isHtml ? (
        <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px] border shadow-sm bill-text-content">
          <div 
            dangerouslySetInnerHTML={{ __html: getDisplayText() }} 
            className="prose max-w-none"
          />
        </div>
      ) : (
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto max-h-[600px] border">
          {getDisplayText()}
        </div>
      )}
      
      {content.length > 500 && !showFullText && (
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
  );
};

export default TextContentDisplay;
