
import { useMemo } from "react";
import { BillVersion, BillSection } from "@/types";
import { diffWords } from "diff";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";
import { isHtmlContent, safeContentSize } from "./comparisonUtils";

interface VisualDiffViewProps {
  leftVersion: BillVersion | undefined;
  rightVersion: BillVersion | undefined;
}

interface SectionDiff {
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

const VisualDiffView = ({ leftVersion, rightVersion }: VisualDiffViewProps) => {
  const sectionDiffs = useMemo(() => {
    if (!leftVersion || !rightVersion) return null;

    const leftSectionsMap = new Map(leftVersion.sections.map(s => [s.id, s]));
    const rightSectionsMap = new Map(rightVersion.sections.map(s => [s.id, s]));
    
    const allSectionIds = Array.from(
      new Set([...leftSectionsMap.keys(), ...rightSectionsMap.keys()])
    );

    return allSectionIds.map(sectionId => {
      const leftSection = leftSectionsMap.get(sectionId);
      const rightSection = rightSectionsMap.get(sectionId);
      
      const MAX_CONTENT_LENGTH = 20000;
      const safeContent = (content: string) => safeContentSize(content, MAX_CONTENT_LENGTH);
      
      const leftIsHtml = leftSection && isHtmlContent(leftSection.content);
      const rightIsHtml = rightSection && isHtmlContent(rightSection.content);
      
      if (leftSection && rightSection) {
        if (leftIsHtml || rightIsHtml) {
          return {
            id: sectionId,
            leftTitle: leftSection.title,
            rightTitle: rightSection.title,
            leftContent: leftSection.content,
            rightContent: rightSection.content,
            isHtml: true,
            onlyInLeft: false,
            onlyInRight: false,
          };
        }
        
        const leftContent = safeContent(leftSection.content);
        const rightContent = safeContent(rightSection.content);
        
        const isTooLarge = 
          (leftContent?.length || 0) + (rightContent?.length || 0) > 40000;
          
        const changes = isTooLarge ? 
          [{ value: "Content too large for visual diff, please use side-by-side view", added: false, removed: false }] : 
          diffWords(leftContent || "", rightContent || "");
          
        return {
          id: sectionId,
          leftTitle: leftSection.title,
          rightTitle: rightSection.title,
          changes,
          onlyInLeft: false,
          onlyInRight: false,
          isTooLarge,
          isHtml: false
        };
      } else if (leftSection) {
        return {
          id: sectionId,
          leftTitle: leftSection.title,
          rightTitle: null,
          content: safeContent(leftSection.content),
          onlyInLeft: true,
          onlyInRight: false,
          isHtml: leftIsHtml
        };
      } else if (rightSection) {
        return {
          id: sectionId,
          leftTitle: null,
          rightTitle: rightSection.title,
          content: safeContent(rightSection.content),
          onlyInLeft: false,
          onlyInRight: true,
          isHtml: rightIsHtml
        };
      }
      
      return null;
    }).filter(Boolean) as SectionDiff[];
  }, [leftVersion, rightVersion]);

  if (!sectionDiffs || !sectionDiffs.length) {
    return <p className="text-muted-foreground">No differences found between selected versions.</p>;
  }

  return (
    <>
      {sectionDiffs.map((diff) => {
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
                  <TextContentDisplay content={diff.content || ""} isHtml={true} />
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
                  <TextContentDisplay content={diff.content || ""} isHtml={true} />
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
                {diff.changes?.map((part, index) => {
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
      })}
    </>
  );
};

export default VisualDiffView;
