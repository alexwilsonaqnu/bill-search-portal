
import React from "react";
import { BillSection } from "@/types";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";
import { isHtmlContent, safeContentSize, renderHighlightedText } from "../utils/contentUtils";

interface SectionModifiedViewProps {
  leftSection: BillSection;
  rightSection: BillSection;
}

const SectionModifiedView = ({ leftSection, rightSection }: SectionModifiedViewProps) => {
  const leftIsHtml = isHtmlContent(leftSection.content);
  const rightIsHtml = isHtmlContent(rightSection.content);
  
  const leftContent = safeContentSize(leftSection.content || "");
  const rightContent = safeContentSize(rightSection.content || "");
  const isSameContent = leftContent === rightContent;

  // Only perform diff highlighting for non-HTML content
  let highlightedContent = { leftHighlighted: null, rightHighlighted: null, hasDifferences: !isSameContent };
  
  if (!leftIsHtml && !rightIsHtml && !isSameContent) {
    highlightedContent = renderHighlightedText(leftContent, rightContent);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-primary mb-2">
            {leftSection.title}
          </h3>
          <div className={`rounded-md ${!isSameContent ? 'bg-red-50' : 'bg-gray-50'}`}>
            {leftIsHtml ? (
              <TextContentDisplay content={leftContent} isHtml={true} />
            ) : (
              <div className="p-4">
                {highlightedContent.leftHighlighted || <p className="whitespace-pre-wrap">{leftContent}</p>}
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-brand-primary mb-2">
            {rightSection.title}
          </h3>
          <div className={`rounded-md ${!isSameContent ? 'bg-green-50' : 'bg-gray-50'}`}>
            {rightIsHtml ? (
              <TextContentDisplay content={rightContent} isHtml={true} />
            ) : (
              <div className="p-4">
                {highlightedContent.rightHighlighted || <p className="whitespace-pre-wrap">{rightContent}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      {!isSameContent && (
        <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <span className="font-medium">Change:</span> Content has been modified between versions
        </div>
      )}
    </>
  );
};

export default SectionModifiedView;
