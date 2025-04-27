
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import parse from 'html-react-parser';

interface TextContentDisplayProps {
  content: string;
  isHtml: boolean;
}

const TextContentDisplay = ({ content, isHtml }: TextContentDisplayProps) => {
  const [showFullText, setShowFullText] = useState(true);
  
  // Function to clean up HTML content
  const cleanHtmlContent = (htmlContent: string) => {
    // Remove excess whitespace between tags
    const cleanedContent = htmlContent
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add basic styling to common elements
    return `
      <div class="bill-text-content">
        ${cleanedContent}
      </div>
    `;
  };
  
  // Get display text with proper truncation
  const getDisplayText = () => {
    if (!content) return "";
    
    if (showFullText || content.length <= 500) {
      return content;
    }
    
    if (isHtml) {
      // Basic HTML truncation - not perfect but provides a cutoff
      return content.substring(0, 500) + "... <p>[Content truncated]</p>";
    }
    
    return content.substring(0, 500) + "...";
  };

  // Custom options for the HTML parser
  const parserOptions = {
    replace: (domNode: any) => {
      // Only process actual elements (not text nodes)
      if (domNode.type !== 'tag') return;
      
      if (domNode.name === 'table') {
        // Add responsive table wrapper and styling
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {domNode.children && domNode.children.map ? 
                domNode.children.map((child: any, i: number) => 
                  <React.Fragment key={i}>{parse(child.toString())}</React.Fragment>
                ) : null}
            </table>
          </div>
        );
      }
      if (domNode.name === 'code') {
        // Style code blocks
        return (
          <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">
            {domNode.children && domNode.children.map ? 
              domNode.children.map((child: any, i: number) => 
                <React.Fragment key={i}>{child.data || ''}</React.Fragment>
              ) : null}
          </code>
        );
      }
      // Return undefined for all other tags to let the parser handle them
      return undefined;
    }
  };
  
  return (
    <div className="mt-4">
      {isHtml ? (
        <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px] border shadow-sm">
          <style>{`
            .bill-text-content {
              font-family: system-ui, -apple-system, sans-serif;
            }
            .bill-text-content table {
              border-collapse: collapse;
              width: 100%;
            }
            .bill-text-content td, .bill-text-content th {
              border: 1px solid #e5e7eb;
              padding: 8px;
            }
            .bill-text-content pre {
              white-space: pre-wrap;
              font-family: ui-monospace, monospace;
              font-size: 0.9em;
              background-color: #f3f4f6;
              padding: 0.5em;
              border-radius: 4px;
            }
          `}</style>
          {parse(cleanHtmlContent(getDisplayText()), parserOptions)}
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
          onClick={() => setShowFullText(true)}
        >
          Show Full Text
        </Button>
      )}
    </div>
  );
};

export default TextContentDisplay;
