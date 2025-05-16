
import React from "react";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";

interface HtmlContentViewProps {
  title: string | null;
  leftContent?: string;
  rightContent?: string;
}

const HtmlContentView = ({ title, leftContent, rightContent }: HtmlContentViewProps) => {
  return (
    <div className="mb-8 border rounded-md overflow-hidden">
      <div className="p-3 bg-blue-100 flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">HTML Content</span>
      </div>
      <div className="p-4 bg-white">
        <p className="text-blue-700 mb-2">
          HTML content is best viewed in side-by-side mode. Here's a formatted version:
        </p>
        {leftContent && (
          <TextContentDisplay 
            content={leftContent} 
            isHtml={true} 
          />
        )}
        {rightContent && !leftContent && (
          <TextContentDisplay 
            content={rightContent} 
            isHtml={true} 
          />
        )}
      </div>
    </div>
  );
};

export default HtmlContentView;
