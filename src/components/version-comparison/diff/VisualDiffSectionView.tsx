
import React from "react";
import { diffWords } from "diff";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";
import { isHtmlContent, safeContentSize } from "../utils/contentUtils";

interface VisualDiffSectionViewProps {
  id: string;
  leftTitle: string | null;
  rightTitle: string | null;
  changes?: any[];
  leftContent?: string;
  rightContent?: string;
  content?: string;
  onlyInLeft: boolean;
  onlyInRight: boolean;
  isTooLarge?: boolean;
  isHtml: boolean;
}

const VisualDiffSectionView = ({
  id,
  leftTitle,
  rightTitle,
  changes,
  content,
  leftContent,
  rightContent,
  onlyInLeft,
  onlyInRight,
  isTooLarge,
  isHtml
}: VisualDiffSectionViewProps) => {
  
  if (isHtml) {
    return (
      <div className="mb-8 border rounded-md overflow-hidden">
        <div className="p-3 bg-blue-100 flex justify-between items-center">
          <h3 className="font-medium">{leftTitle || rightTitle}</h3>
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
  }

  if (isTooLarge) {
    return (
      <div className="mb-8 border rounded-md overflow-hidden">
        <div className="p-3 bg-amber-100 flex justify-between items-center">
          <h3 className="font-medium">{leftTitle} → {rightTitle}</h3>
          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">Content Too Large</span>
        </div>
        <div className="p-4 bg-white">
          <p className="text-amber-700">
            This content is too large for visual diff comparison. Please use the side-by-side view instead.
          </p>
        </div>
      </div>
    );
  }
  
  if (onlyInLeft) {
    return (
      <div className="mb-8 border rounded-md overflow-hidden">
        <div className="p-3 bg-red-100 flex justify-between items-center">
          <h3 className="font-medium">{leftTitle}</h3>
          <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Removed</span>
        </div>
        <div className="p-4 bg-red-50">
          {isHtml ? (
            <TextContentDisplay content={content || ""} isHtml={true} />
          ) : (
            <p className="whitespace-pre-wrap text-red-800 line-through">{content}</p>
          )}
        </div>
      </div>
    );
  }

  if (onlyInRight) {
    return (
      <div className="mb-8 border rounded-md overflow-hidden">
        <div className="p-3 bg-green-100 flex justify-between items-center">
          <h3 className="font-medium">{rightTitle}</h3>
          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Added</span>
        </div>
        <div className="p-4 bg-green-50">
          {isHtml ? (
            <TextContentDisplay content={content || ""} isHtml={true} />
          ) : (
            <p className="whitespace-pre-wrap text-green-800">{content}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 border rounded-md overflow-hidden">
      <div className="p-3 bg-yellow-100 flex justify-between items-center">
        <h3 className="font-medium">{leftTitle} → {rightTitle}</h3>
        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Modified</span>
      </div>
      <div className="p-4 bg-white">
        <div className="whitespace-pre-wrap font-mono text-sm">
          {changes?.map((part, index) => {
            const className = part.added 
              ? "bg-green-100 text-green-800" 
              : part.removed 
                ? "bg-red-100 text-red-800 line-through" 
                : "";
            return (
              <span key={index} className={className}>
                {part.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisualDiffSectionView;
