
import React from "react";
import { BillSection } from "@/types";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";
import { isHtmlContent, safeContentSize, renderHighlightedText } from "./diffUtils";

interface SideBySideComparisonProps {
  leftSections: BillSection[];
  rightSections: BillSection[];
}

const SideBySideComparison = ({ leftSections = [], rightSections = [] }: SideBySideComparisonProps) => {
  const allSectionIds = Array.from(
    new Set([
      ...leftSections.map((s) => s.id),
      ...rightSections.map((s) => s.id),
    ])
  );

  return allSectionIds.map((sectionId) => {
    const leftSection = leftSections.find((s) => s.id === sectionId);
    const rightSection = rightSections.find((s) => s.id === sectionId);
    
    const leftIsHtml = leftSection && isHtmlContent(leftSection.content);
    const rightIsHtml = rightSection && isHtmlContent(rightSection.content);

    if (leftSection && rightSection) {
      const leftContent = safeContentSize(leftSection.content || "");
      const rightContent = safeContentSize(rightSection.content || "");
      const isSameContent = leftContent === rightContent;

      // Only perform diff highlighting for non-HTML content
      let highlightedContent = { leftHighlighted: null, rightHighlighted: null, hasDifferences: !isSameContent };
      
      if (!leftIsHtml && !rightIsHtml && !isSameContent) {
        highlightedContent = renderHighlightedText(leftContent, rightContent);
      }

      return (
        <div key={sectionId} className="mb-8">
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
        </div>
      );
    }

    if (leftSection && !rightSection) {
      return (
        <div key={sectionId} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-brand-primary mb-2">
                {leftSection.title}
              </h3>
              <div className="rounded-md bg-red-50">
                {leftIsHtml ? (
                  <TextContentDisplay content={safeContentSize(leftSection.content)} isHtml={true} />
                ) : (
                  <div className="p-4">
                    <p className="whitespace-pre-wrap">{safeContentSize(leftSection.content)}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                [Removed in this version]
              </h3>
              <div className="p-4 rounded-md bg-gray-50 border border-dashed border-gray-300 text-gray-400 italic">
                This section does not exist in the selected version
              </div>
            </div>
          </div>
          <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="font-medium">Change:</span> Section removed in newer version
          </div>
        </div>
      );
    }

    if (!leftSection && rightSection) {
      return (
        <div key={sectionId} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                [Added in newer version]
              </h3>
              <div className="p-4 rounded-md bg-gray-50 border border-dashed border-gray-300 text-gray-400 italic">
                This section does not exist in the selected version
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-primary mb-2">
                {rightSection.title}
              </h3>
              <div className="rounded-md bg-green-50">
                {rightIsHtml ? (
                  <TextContentDisplay content={safeContentSize(rightSection.content)} isHtml={true} />
                ) : (
                  <div className="p-4">
                    <p className="whitespace-pre-wrap">{safeContentSize(rightSection.content)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="font-medium">Change:</span> New section added in newer version
          </div>
        </div>
      );
    }

    return null;
  });
};

export default SideBySideComparison;
