
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillVersion, BillSection } from "@/types";
import { diffWords, diffChars } from "diff";
import TextContentDisplay from "@/components/bill-detail/text/TextContentDisplay";

interface VersionComparisonProps {
  versions: BillVersion[];
  displayMode?: "side-by-side" | "visual-diff";
  className?: string;
}

const VersionComparison = ({ versions, displayMode = "side-by-side", className = "" }: VersionComparisonProps) => {
  const [leftVersionId, setLeftVersionId] = useState(versions[0]?.id || "");
  const [rightVersionId, setRightVersionId] = useState(
    versions.length > 1 ? versions[1].id : versions[0]?.id || ""
  );

  const leftVersion = versions.find((v) => v.id === leftVersionId);
  const rightVersion = versions.find((v) => v.id === rightVersionId);

  const isHtmlContent = (content: string): boolean => {
    if (!content) return false;
    return /<[a-z][\s\S]*>/i.test(content);
  };

  const sectionDiffs = useMemo(() => {
    if (!leftVersion || !rightVersion || displayMode !== "visual-diff") return null;

    const leftSectionsMap = new Map(leftVersion.sections.map(s => [s.id, s]));
    const rightSectionsMap = new Map(rightVersion.sections.map(s => [s.id, s]));
    
    const allSectionIds = Array.from(
      new Set([...leftSectionsMap.keys(), ...rightSectionsMap.keys()])
    );

    return allSectionIds.map(sectionId => {
      const leftSection = leftSectionsMap.get(sectionId);
      const rightSection = rightSectionsMap.get(sectionId);
      
      const safeContentSize = (content: string) => {
        const MAX_CONTENT_LENGTH = 20000;
        if (content && content.length > MAX_CONTENT_LENGTH) {
          return content.substring(0, MAX_CONTENT_LENGTH) + 
            " ... [Content truncated to prevent performance issues. Full comparison available in side-by-side view]";
        }
        return content;
      };
      
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
        
        const leftContent = safeContentSize(leftSection.content);
        const rightContent = safeContentSize(rightSection.content);
        
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
          content: safeContentSize(leftSection.content),
          onlyInLeft: true,
          onlyInRight: false,
          isHtml: leftIsHtml
        };
      } else if (rightSection) {
        return {
          id: sectionId,
          leftTitle: null,
          rightTitle: rightSection.title,
          content: safeContentSize(rightSection.content),
          onlyInLeft: false,
          onlyInRight: true,
          isHtml: rightIsHtml
        };
      }
      
      return null;
    }).filter(Boolean);
  }, [leftVersion, rightVersion, displayMode]);

  // New function to highlight differences in text for side-by-side view
  const renderHighlightedText = (leftContent: string, rightContent: string) => {
    // Only run diff on reasonably sized content to prevent performance issues
    if (leftContent.length > 50000 || rightContent.length > 50000) {
      return {
        leftHighlighted: <span>{leftContent}</span>,
        rightHighlighted: <span>{rightContent}</span>,
        hasDifferences: leftContent !== rightContent
      };
    }

    // Use diffChars for character-level diff (more precise than diffWords)
    const changes = diffChars(leftContent, rightContent);

    // Process left content (removals)
    const leftHighlighted = (
      <span>
        {changes.map((change, i) => {
          if (change.removed || !change.added) {
            return (
              <span 
                key={i} 
                className={change.removed ? "bg-red-100" : ""}
              >
                {change.value}
              </span>
            );
          }
          return null;
        })}
      </span>
    );

    // Process right content (additions)
    const rightHighlighted = (
      <span>
        {changes.map((change, i) => {
          if (change.added || !change.removed) {
            return (
              <span 
                key={i} 
                className={change.added ? "bg-green-100" : ""}
              >
                {change.value}
              </span>
            );
          }
          return null;
        })}
      </span>
    );

    return { 
      leftHighlighted,
      rightHighlighted,
      hasDifferences: changes.some(c => c.added || c.removed)
    };
  };

  const renderSideBySideComparison = (
    leftSections: BillSection[] = [],
    rightSections: BillSection[] = []
  ) => {
    const safeContentSize = (content: string) => {
      const MAX_CONTENT_LENGTH = 50000;
      if (content && content.length > MAX_CONTENT_LENGTH) {
        return content.substring(0, MAX_CONTENT_LENGTH) + 
          " ... [Content truncated to prevent performance issues]";
      }
      return content;
    };
    
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

  const renderVisualDiffComparison = () => {
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
              {diff.changes.map((part, index) => {
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

  if (!versions.length) {
    return (
      <Card className={`p-6 ${className}`}>
        <p className="text-muted-foreground">No versions available for comparison.</p>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-medium mb-2 text-gray-600">Version 1</h3>
          <Select
            value={leftVersionId}
            onValueChange={setLeftVersionId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={`left-${version.id}`} value={version.id}>
                  {version.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <h3 className="font-medium mb-2 text-gray-600">Version 2</h3>
          <Select
            value={rightVersionId}
            onValueChange={setRightVersionId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={`right-${version.id}`} value={version.id}>
                  {version.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8">
        {leftVersion && rightVersion ? (
          displayMode === "visual-diff" ? (
            renderVisualDiffComparison()
          ) : (
            renderSideBySideComparison(leftVersion.sections, rightVersion.sections)
          )
        ) : (
          <p className="text-muted-foreground">Select versions to compare</p>
        )}
      </div>
    </div>
  );
};

export default VersionComparison;
