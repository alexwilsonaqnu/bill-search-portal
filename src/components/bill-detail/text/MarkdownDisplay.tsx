
import React from 'react';
import parse from 'html-react-parser';
import { convertMarkdownToHtml } from './textUtils';

interface MarkdownDisplayProps {
  content: string;
}

const MarkdownDisplay = ({ content }: MarkdownDisplayProps) => {
  const htmlContent = convertMarkdownToHtml(content);

  return (
    <div className="bg-white p-4 rounded-md overflow-auto max-h-[600px] border shadow-sm prose prose-slate max-w-none">
      {parse(htmlContent)}
    </div>
  );
};

export default MarkdownDisplay;
