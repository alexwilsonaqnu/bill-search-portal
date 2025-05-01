
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
    return domToReact(safeNodes);
  };

  // Custom options for the HTML parser
  const parserOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element) {
        if (domNode.name === 'table') {
          // Add responsive table wrapper and styling
          const tableRows = Array.from(domNode.children || [])
            .filter(child => child instanceof Element && child.name === 'tr');

          return (
            <div className="overflow-x-auto mb-4">
              <Table>
                <TableHeader>
                  {tableRows.length > 0 && tableRows[0] instanceof Element && (
                    <TableRow>
                      {Array.from(tableRows[0].children || [])
                        .filter(cell => cell instanceof Element && (cell.name === 'td' || cell.name === 'th'))
                        .map((cell, i) => (
                          <TableHead key={i}>
                            {cell instanceof Element && 
                              safelyDomToReact(cell.children)}
                          </TableHead>
                        ))}
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {tableRows.slice(1).map((row, i) => (
                    <TableRow key={i}>
                      {row instanceof Element && Array.from(row.children || [])
                        .filter(cell => cell instanceof Element && (cell.name === 'td' || cell.name === 'th'))
                        .map((cell, j) => (
                          <TableCell key={j}>
                            {cell instanceof Element && 
                              safelyDomToReact(cell.children)}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        } else if (domNode.name === 'code') {
          // Style code blocks
          return (
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">
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
        }
      }
      
      return undefined;
    }
  };

  return (
    <>
      <style>{`
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
      {parse(htmlContent, parserOptions)}
    </>
  );
};

export default HtmlContentParser;
