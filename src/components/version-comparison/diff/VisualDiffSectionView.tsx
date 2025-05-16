
import React from "react";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";
import HtmlContentView from "./HtmlContentView";
import LargeContentView from "./LargeContentView";
import ModifiedContentView from "./ModifiedContentView";
import { SectionDiff } from "../utils/diffUtils";

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
}: SectionDiff) => {
  
  if (isHtml) {
    return (
      <HtmlContentView 
        title={leftTitle || rightTitle}
        leftContent={leftContent}
        rightContent={rightContent}
      />
    );
  }

  if (isTooLarge) {
    return (
      <LargeContentView
        leftTitle={leftTitle}
        rightTitle={rightTitle}
      />
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
    <ModifiedContentView
      leftTitle={leftTitle}
      rightTitle={rightTitle}
      changes={changes || []}
    />
  );
};

export default VisualDiffSectionView;
