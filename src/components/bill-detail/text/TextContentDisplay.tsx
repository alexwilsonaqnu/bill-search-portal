
import { useState } from "react";
import parse from 'html-react-parser';
import { Element, domToReact, HTMLReactParserOptions, DOMNode } from 'html-react-parser';
import TableRenderer from "./components/TableRenderer";
import ShowMoreButton from "./components/ShowMoreButton";
import { cleanHtmlContent, extractMeaningfulContent } from "./utils/htmlCleaner";
import { textContentStyles } from "./styles/TextContentStyles";

interface TextContentDisplayProps {
  content: string;
  isHtml: boolean;
}

const TextContentDisplay = ({ content, isHtml }: TextContentDisplayProps) => {
  const [showFullText, setShowFullText] = useState(true);

  const getDisplayText = () => {
    if (!content) return "";
    
    if (showFullText || content.length <= 500) {
      return content;
    }
    
    if (isHtml) {
      return content.substring(0, 500) + "... <p>[Content truncated]</p>";
    }
    
    return content.substring(0, 500) + "...";
  };

  const parserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        if (domNode.name === 'table') {
          return <TableRenderer node={domNode} options={parserOptions} />;
        }
        if (domNode.name === 'code') {
          return (
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">
              {domNode.children && domToReact(domNode.children, parserOptions)}
            </code>
          );
        }
        if (domNode.name === 'font') {
          return (
            <span className="font-medium">
              {domNode.children && domToReact(domNode.children, parserOptions)}
            </span>
          );
        }
      }
      return undefined;
    }
  };

  const isRawHtmlTags = content && typeof content === 'string' && 
    (content.includes('<table') || content.includes('<tr>') || content.includes('<td>')) &&
    (content.includes('&lt;') || content.includes('&gt;'));

  return (
    <div className="mt-4">
      {isHtml ? (
        <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px] border shadow-sm">
          <style>{textContentStyles}</style>
          {parse(cleanHtmlContent(getDisplayText()), parserOptions)}
        </div>
      ) : (
        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto max-h-[600px] border">
          {getDisplayText()}
        </div>
      )}
      
      {content.length > 500 && !showFullText && (
        <ShowMoreButton onClick={() => setShowFullText(true)} />
      )}
    </div>
  );
};

export default TextContentDisplay;
