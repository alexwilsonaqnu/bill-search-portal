
import React from 'react';
import HtmlContentParser from './HtmlContentParser';
import { cleanHtmlContent } from './textUtils';

interface HtmlDisplayProps {
  content: string;
}

const HtmlDisplay = ({ content }: HtmlDisplayProps) => {
  const cleanedContent = cleanHtmlContent(content);

  return (
    <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px] border shadow-sm">
      <HtmlContentParser htmlContent={cleanedContent} />
    </div>
  );
};

export default HtmlDisplay;
