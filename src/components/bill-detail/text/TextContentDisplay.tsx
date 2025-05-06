
import { useState } from "react";
import { detectContentType, getDisplayText } from './textUtils';
import HtmlDisplay from './HtmlDisplay';
import MarkdownDisplay from './MarkdownDisplay';
import PlainTextDisplay from './PlainTextDisplay';
import ShowMoreButton from './ShowMoreButton';
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TextContentDisplayProps {
  content: string;
  isHtml: boolean;
  isFullScreen?: boolean;
  onFullScreenToggle?: () => void;
}

const TextContentDisplay = ({ 
  content, 
  isHtml,
  isFullScreen = false,
  onFullScreenToggle
}: TextContentDisplayProps) => {
  const [showFullText, setShowFullText] = useState(false);
  
  // Get the display text with proper truncation
  const displayText = getDisplayText(content, isHtml, showFullText || isFullScreen);
  
  // Detect if content is Markdown when not explicitly HTML
  const contentType = isHtml ? 'html' : detectContentType(content);
  
  const renderContent = () => (
    <>
      {contentType === 'html' ? (
        <HtmlDisplay content={displayText} />
      ) : contentType === 'markdown' ? (
        <MarkdownDisplay content={displayText} />
      ) : (
        <PlainTextDisplay content={displayText} />
      )}
      
      {content.length > 500 && !showFullText && !isFullScreen && (
        <ShowMoreButton onClick={() => setShowFullText(true)} />
      )}
    </>
  );

  return (
    <div className={`mt-4 ${isFullScreen ? 'h-[75vh] overflow-auto' : ''}`}>
      {renderContent()}
    </div>
  );
};

export default TextContentDisplay;
