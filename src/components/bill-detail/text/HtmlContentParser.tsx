
import React from 'react';
import parse, { HTMLReactParserOptions, Element, domToReact, DOMNode } from 'html-react-parser';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HtmlContentParserProps {
  htmlContent: string;
}

const HtmlContentParser = ({ htmlContent }: HtmlContentParserProps) => {
  // Helper function to safely filter and cast nodes for domToReact
  const safelyFilterNodes = (nodes: Element['children'] | null): DOMNode[] => {
    if (!nodes) return [];
    
    // Filter out comment nodes and cast to DOMNode[]
    return Array.from(nodes)
      .filter(node => 
        node.type !== 'comment' && 
        node.type !== 'directive'
      ) as DOMNode[];
  };

  // Safe wrapper for domToReact to handle type issues
  const safelyDomToReact = (nodes: Element['children'] | null) => {
    if (!nodes) return null;
    const safeNodes = safelyFilterNodes(nodes);
    return domToReact(safeNodes, parserOptions);
  };

  // Custom options for the HTML parser
  const parserOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        // Handle style tags - preserve them but don't render in DOM
        if (domNode.name === 'style') {
          return <></>;
        }
        
        // Handle tables with responsive design
        if (domNode.name === 'table') {
          // Add responsive table wrapper and styling
          const tableRows = Array.from(domNode.children || [])
            .filter(child => child instanceof Element && 
                   (child.name === 'tr' || child.name === 'tbody' || child.name === 'thead'));
          
          // Extract rows from nested tbody/thead if present
          let allRows: Element[] = [];
          tableRows.forEach(row => {
            if (row instanceof Element) {
              if (row.name === 'tr') {
                allRows.push(row);
              } else if ((row.name === 'tbody' || row.name === 'thead') && row.children) {
                allRows = allRows.concat(
                  Array.from(row.children)
                    .filter(child => child instanceof Element && child.name === 'tr') as Element[]
                );
              }
            }
          });

          if (allRows.length === 0) {
            return null;
          }

          return (
            <div className="overflow-x-auto mb-4">
              <Table>
                <TableHeader>
                  {allRows.length > 0 && allRows[0] instanceof Element && (
                    <TableRow>
                      {Array.from(allRows[0].children || [])
                        .filter(cell => cell instanceof Element && (cell.name === 'td' || cell.name === 'th'))
                        .map((cell, i) => (
                          <TableHead key={i} className="whitespace-nowrap">
                            {cell instanceof Element && safelyDomToReact(cell.children)}
                          </TableHead>
                        ))}
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {allRows.slice(1).map((row, i) => (
                    <TableRow key={i}>
                      {row instanceof Element && Array.from(row.children || [])
                        .filter(cell => cell instanceof Element && (cell.name === 'td' || cell.name === 'th'))
                        .map((cell, j) => (
                          <TableCell key={j}>
                            {cell instanceof Element && safelyDomToReact(cell.children)}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        } else if (domNode.name === 'meta') {
          // Skip meta tags
          return <></>;
        } else if (domNode.name === 'code' || domNode.name === 'pre') {
          // Style code blocks
          return (
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm block whitespace-pre-wrap font-mono">
              {safelyDomToReact(domNode.children)}
            </code>
          );
        } else if (domNode.name === 'font') {
          // Handle font tags (common in legislative documents)
          return (
            <span className="font-medium">
              {safelyDomToReact(domNode.children)}
            </span>
          );
        } else if (domNode.name === 's') {
          // Strikethrough text (deletions in bills)
          return (
            <span className="line-through text-red-700">
              {safelyDomToReact(domNode.children)}
            </span>
          );
        } else if (domNode.name === 'u') {
          // Underline text (additions in bills)
          return (
            <span className="underline text-green-700">
              {safelyDomToReact(domNode.children)}
            </span>
          );
        } else if (domNode.name === 'center') {
          // Centered text (often section headers)
          return (
            <div className="text-center font-semibold py-2">
              {safelyDomToReact(domNode.children)}
            </div>
          );
        }
      }
      
      return undefined;
    }
  };

  // If the content is very basic HTML, enhance it with basic styling
  const enhancedContent = htmlContent.includes('<style') 
    ? htmlContent 
    : `<div class="bill-text-content">${htmlContent}</div>`;

  return (
    <>
      <style jsx global>{`
        .bill-text-content {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .bill-text-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1e40af;
        }
        .bill-text-content h3 {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
          color: #1e40af;
        }
        .bill-text-content p {
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .bill-text-content td, .bill-text-content th {
          border: 1px solid #e5e7eb;
          padding: 8px;
          vertical-align: top;
        }
        .bill-text-content pre {
          white-space: pre-wrap;
          font-family: ui-monospace, monospace;
          font-size: 0.9em;
          background-color: #f3f4f6;
          padding: 0.5em;
          border-radius: 4px;
        }
        .bill-text-content s {
          color: #991b1b;
        }
        .bill-text-content u {
          color: #166534;
        }
        .bill-text-content center {
          font-weight: 600;
        }
      `}</style>
      <div className="bill-content-wrapper">
        {parse(enhancedContent, parserOptions)}
      </div>
    </>
  );
};

export default HtmlContentParser;
