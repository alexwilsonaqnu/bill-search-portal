
import React from 'react';
import HtmlContentParser from './HtmlContentParser';
import { cleanHtmlContent } from './textUtils';
import { Card } from '@/components/ui/card';

interface HtmlDisplayProps {
  content: string;
}

const HtmlDisplay = ({ content }: HtmlDisplayProps) => {
  const cleanedContent = cleanHtmlContent(content);
  
  // Detect if this is a full HTML document or just a fragment
  const isFullHtml = content.includes('<!DOCTYPE') || 
                     content.includes('<html>') ||
                     content.includes('<body>');
  
  // For full HTML documents, we need to extract the body content
  let displayContent = cleanedContent;
  
  if (isFullHtml) {
    // No need to modify content as HtmlContentParser can handle full HTML documents
    // The parser will extract useful parts while preserving styling
    displayContent = content;
  }

  return (
    <Card className="bg-white p-4 rounded-md overflow-auto max-h-[60vh] border shadow-sm">
      <HtmlContentParser htmlContent={displayContent} />
    </Card>
  );
};

export default HtmlDisplay;
