
import React from 'react';
import parse from 'html-react-parser';

interface HtmlContentParserProps {
  htmlContent: string;
}

const HtmlContentParser = ({ htmlContent }: HtmlContentParserProps) => {
  if (!htmlContent) {
    return <div className="text-gray-500">No content available</div>;
  }
  
  // Add basic styling to ensure content is readable
  const styledContent = htmlContent.includes('<style') ? 
    htmlContent : 
    `<style>
      body { font-family: system-ui, sans-serif; line-height: 1.5; }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ddd; padding: 8px; }
      h1, h2, h3 { margin-top: 1em; }
    </style>${htmlContent}`;
  
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: styledContent }} />
  );
};

export default HtmlContentParser;
