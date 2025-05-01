
import { useState } from "react";
import { detectContentType, getDisplayText } from './textUtils';
import HtmlDisplay from './HtmlDisplay';
import MarkdownDisplay from './MarkdownDisplay';
import PlainTextDisplay from './PlainTextDisplay';
import ShowMoreButton from './ShowMoreButton';

interface TextContentDisplayProps {
  content: string;
  isHtml: boolean;
}

const TextContentDisplay = ({ content, isHtml }: TextContentDisplayProps) => {
  const [showFullText, setShowFullText] = useState(false);
  
  // Get the display text with proper truncation
  const displayText = getDisplayText(content, isHtml, showFullText);
  
  // Detect if content is Markdown when not explicitly HTML
  const contentType = isHtml ? 'html' : detectContentType(content);
  
  return (
    <div className="mt-4">
      {contentType === 'html' ? (
        <HtmlDisplay content={displayText} />
      ) : contentType === 'markdown' ? (
        <MarkdownDisplay content={displayText} />
      ) : (
        <PlainTextDisplay content={displayText} />
      )}
      
      {content.length > 500 && !showFullText && (
        <ShowMoreButton onClick={() => setShowFullText(true)} />
      )}
    </div>
  );
};

export default TextContentDisplay;
