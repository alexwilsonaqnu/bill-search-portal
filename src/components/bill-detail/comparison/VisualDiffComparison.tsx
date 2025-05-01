
import React from "react";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";

interface VisualDiffProps {
  sectionDiffs: any[];
}

const VisualDiffComparison = ({ sectionDiffs }: VisualDiffProps) => {
  if (!sectionDiffs || !sectionDiffs.length) {
    return <p className="text-muted-foreground">No differences found between selected versions.</p>;
  }

  return sectionDiffs.map((diff) => {
    if (diff.isHtml) {
      return (
        <div key={diff.id} className="mb-8 border rounded-md overflow-hidden">
          <div className="p-3 bg-blue-100 flex justify-between items-center">
            <h3 className="font-medium">{diff.leftTitle || diff.rightTitle}</h3>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">HTML Content</span>
          </div>
          <div className="p-4 bg-white">
            <p className="text-blue-700 mb-2">
              HTML content is best viewed in side-by-side mode. Here's a formatted version:
            </p>
            {diff.leftContent && (
              <TextContentDisplay 
                content={diff.leftContent} 
                isHtml={true} 
              />
            )}
            {diff.rightContent && !diff.leftContent && (
              <TextContentDisplay 
                content={diff.rightContent} 
                isHtml={true} 
              />
            )}
          </div>
        </div>
      );
    }

    if (diff.isTooLarge) {
      return (
        <div key={diff.id} className="mb-8 border rounded-md overflow-hidden">
          <div className="p-3 bg-amber-100 flex justify-between items-center">
            <h3 className="font-medium">{diff.leftTitle} → {diff.rightTitle}</h3>
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
    
    if (diff.onlyInLeft) {
      return (
        <div key={diff.id} className="mb-8 border rounded-md overflow-hidden">
          <div className="p-3 bg-red-100 flex justify-between items-center">
            <h3 className="font-medium">{diff.leftTitle}</h3>
            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Removed</span>
          </div>
          <div className="p-4 bg-red-50">
            {diff.isHtml ? (
              <TextContentDisplay content={diff.content} isHtml={true} />
            ) : (
              <p className="whitespace-pre-wrap text-red-800 line-through">{diff.content}</p>
            )}
          </div>
        </div>
      );
    }

    if (diff.onlyInRight) {
      return (
        <div key={diff.id} className="mb-8 border rounded-md overflow-hidden">
          <div className="p-3 bg-green-100 flex justify-between items-center">
            <h3 className="font-medium">{diff.rightTitle}</h3>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Added</span>
          </div>
          <div className="p-4 bg-green-50">
            {diff.isHtml ? (
              <TextContentDisplay content={diff.content} isHtml={true} />
            ) : (
              <p className="whitespace-pre-wrap text-green-800">{diff.content}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={diff.id} className="mb-8 border rounded-md overflow-hidden">
        <div className="p-3 bg-yellow-100 flex justify-between items-center">
          <h3 className="font-medium">{diff.leftTitle} → {diff.rightTitle}</h3>
          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Modified</span>
        </div>
        <div className="p-4 bg-white">
          <div className="whitespace-pre-wrap font-mono text-sm">
            {diff.changes.map((part: any, index: number) => {
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
  });
};

export default VisualDiffComparison;
