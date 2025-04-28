
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BillVersion } from "@/types";
import { diffWords } from "diff";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VersionSelector from "./bill-detail/comparison/VersionSelector";
import VisualDiffView from "./bill-detail/comparison/VisualDiffView";
import SideBySideView from "./bill-detail/comparison/SideBySideView";

interface VersionComparisonProps {
  versions: BillVersion[];
  displayMode?: "side-by-side" | "visual-diff";
  className?: string;
}

const VersionComparison = ({ 
  versions, 
  displayMode = "side-by-side", 
  className = "" 
}: VersionComparisonProps) => {
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
        <VersionSelector
          versions={versions}
          selectedVersionId={leftVersionId}
          label="Version 1"
          onVersionChange={setLeftVersionId}
        />
        <VersionSelector
          versions={versions}
          selectedVersionId={rightVersionId}
          label="Version 2"
          onVersionChange={setRightVersionId}
        />
      </div>

      <div className="mt-8">
        {leftVersion && rightVersion ? (
          displayMode === "visual-diff" ? (
            <VisualDiffView sectionDiffs={sectionDiffs || []} />
          ) : (
            <SideBySideView 
              leftSections={leftVersion.sections} 
              rightSections={rightVersion.sections} 
            />
          )
        ) : (
          <p className="text-muted-foreground">Select versions to compare</p>
        )}
      </div>
    </div>
  );
};

export default VersionComparison;
