import { useState } from "react";
import { Button } from "@/components/ui/button";
import parse, { HTMLReactParserOptions, Element, domToReact, DOMNode } from 'html-react-parser';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TextContentDisplayProps {
  content: string;
  isHtml: boolean;
}

const TextContentDisplay = ({ content, isHtml }: TextContentDisplayProps) => {
  const [showFullText, setShowFullText] = useState(true);

  // Function to clean up HTML content
  const cleanHtmlContent = (htmlContent: string) => {
    // Process markdown-style formatting first
    let processedContent = htmlContent
      // Convert headers
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert bullet points
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/(?:\n\n|\r\n\r\n)(- .*(?:\n- .*)*)/g, '<ul class="list-disc mb-4">$1</ul>');

    // Remove excess whitespace between tags
    processedContent = processedContent
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();

    return `
      <div class="bill-text-content">
        ${processedContent}
      </div>
    `;
  };

  // Extract meaningful content from complex HTML
  const extractMeaningfulContent = (htmlContent: string) => {
    // This is a simple extraction that tries to find text content
    // while removing most of the HTML structure
    
    // Check for specific bill headers and content
    const billNumberMatch = htmlContent.match(/HB\d+|SB\d+/);
    const billNumber = billNumberMatch ? billNumberMatch[0] : "";
    
    const synopsisMatch = htmlContent.match(/SYNOPSIS AS INTRODUCED:(.*?)(?:<\/td>|<\/code>)/is);
    const synopsis = synopsisMatch ? synopsisMatch[1].replace(/<\/?[^>]+(>|$)/g, "") : "";
    
    const actContentMatch = htmlContent.match(/AN ACT concerning(.*?)(?:<\/td>|<\/code>)/is);
    const actContent = actContentMatch ? actContentMatch[1].replace(/<\/?[^>]+(>|$)/g, "") : "";
    
    // Extract any other text content that seems important
    const lines = htmlContent
      .replace(/<tr>|<\/tr>|<td[^>]*>|<\/td>|<table[^>]*>|<\/table>|<colgroup[^>]*>|<\/colgroup>/g, " ")
      .replace(/<code>|<\/code>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .split(/\.\s+/);
    
    const importantLines = lines
      .filter(line => line.trim().length > 20) // Only keep lines with substantial content
      .map(line => line.trim() + ".")
      .join("\n\n");
    
    // Formatted output
    return `
      <h2 class="text-lg font-bold mb-4">${billNumber}</h2>
      ${synopsis ? `<div class="mb-4"><h3 class="font-medium">SYNOPSIS</h3><p>${synopsis}</p></div>` : ''}
      ${actContent ? `<div class="mb-4"><h3 class="font-medium">ACT CONTENT</h3><p>${actContent}</p></div>` : ''}
      ${importantLines ? `<div class="mb-4"><h3 class="font-medium">BILL TEXT</h3><p>${importantLines}</p></div>` : ''}
    `;
  };

  // Get display text with proper truncation
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

  // Custom options for the HTML parser
  const parserOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === 'table') {
        // Add responsive table wrapper and styling
        return (
          <div className="overflow-x-auto mb-4">
            <Table>
              <TableHeader>
                {domNode.children.find((child) => {
                  return child instanceof Element && child.name === 'tr';
                }) && (
                  <TableRow>
                    {Array.from(domNode.children)
                      .filter((child): child is Element => 
                        child instanceof Element && child.name === 'tr'
                      )[0]
                      .children
                      .filter((cell): cell is Element => 
                        cell instanceof Element && (cell.name === 'td' || cell.name === 'th')
                      )
                      .map((cell, i) => (
                        <TableHead key={i}>
                          {domToReact(
                            cell instanceof Element && cell.children ? 
                              Array.from(cell.children).filter((node): node is DOMNode => 
                                node instanceof Element || typeof node === 'string'
                              ) : 
                              [], 
                            parserOptions
                          ) || '\u00A0'}
                        </TableHead>
                      ))}
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {Array.from(domNode.children)
                  .filter((child): child is Element => 
                    child instanceof Element && child.name === 'tr'
                  )
                  .slice(1) // Skip the first row as it's used for header
                  .map((row, i) => (
                    <TableRow key={i}>
                      {Array.from(row.children)
                        .filter((cell): cell is Element => 
                          cell instanceof Element && (cell.name === 'td' || cell.name === 'th')
                        )
                        .map((cell, j) => (
                          <TableCell key={j}>
                            {domToReact(
                              cell instanceof Element && cell.children ? 
                                Array.from(cell.children).filter((node): node is DOMNode => 
                                  node instanceof Element || typeof node === 'string'
                                ) : 
                                [], 
                              parserOptions
                            ) || '\u00A0'}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        );
      }
      
      if (domNode instanceof Element && domNode.name === 'code') {
        // Style code blocks
        return (
          <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">
            {domToReact(
              domNode.children ? 
                Array.from(domNode.children).filter((node): node is DOMNode => 
                  node instanceof Element || typeof node === 'string'
                ) : 
                [], 
              parserOptions
            )}
          </code>
        );
      }
      
      // Handle font tags (common in legislative documents)
      if (domNode instanceof Element && domNode.name === 'font') {
        return (
          <span className="font-medium">
            {domToReact(
              domNode.children ? 
                Array.from(domNode.children).filter((node): node is DOMNode => 
                  node instanceof Element || typeof node === 'string'
                ) : 
                [], 
              parserOptions
            )}
          </span>
        );
      }
      
      return undefined;
    }
  };

  // If content is obviously raw HTML tags, display cleaned version
  const isRawHtmlTags = content && typeof content === 'string' && 
    (content.includes('<table') || content.includes('<tr>') || content.includes('<td>')) &&
    (content.includes('&lt;') || content.includes('&gt;'));

  return (
    <div className="mt-4">
      {isHtml ? (
        <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px] border shadow-sm">
          <style>{`
            .bill-text-content {
              font-family: system-ui, -apple-system, sans-serif;
            }
            .bill-text-content h1 {
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 1rem;
              color: #1e40af;
            }
            .bill-text-content h2 {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
              color: #1e40af;
            }
            .bill-text-content h3 {
              font-size: 1.125rem;
              font-weight: 500;
              margin-bottom: 0.5rem;
              color: #1e40af;
            }
            .bill-text-content strong {
              font-weight: 600;
            }
            .bill-text-content em {
              font-style: italic;
            }
            .bill-text-content ul {
              list-style-type: disc;
              padding-left: 1.5rem;
              margin-bottom: 1rem;
            }
            .bill-text-content li {
              margin-bottom: 0.5rem;
            }
            .bill-text-content p {
              margin-bottom: 1rem;
              line-height: 1.5;
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
