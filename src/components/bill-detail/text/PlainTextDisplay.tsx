
import React from 'react';

interface PlainTextDisplayProps {
  content: string;
}

const PlainTextDisplay = ({ content }: PlainTextDisplayProps) => {
  return (
    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-auto max-h-[600px] border">
      {content}
    </div>
  );
};

export default PlainTextDisplay;
