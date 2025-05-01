
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ComparisonProps } from "./comparisonTypes";
import VersionSelector from "./VersionSelector";
import SideBySideComparison from "./SideBySideComparison";
import VisualDiffComparison from "./VisualDiffComparison";
import { computeSectionDiffs } from "./diffUtils";

const VersionComparison = ({ 
  versions, 
  displayMode = "side-by-side", 
  className = "" 
}: ComparisonProps) => {
  const [leftVersionId, setLeftVersionId] = useState(versions[0]?.id || "");
  const [rightVersionId, setRightVersionId] = useState(
    versions.length > 1 ? versions[1].id : versions[0]?.id || ""
  );

  const leftVersion = versions.find((v) => v.id === leftVersionId);
  const rightVersion = versions.find((v) => v.id === rightVersionId);

  // Calculate diffs for visual diff mode
  const sectionDiffs = useMemo(() => {
    if (displayMode !== "visual-diff") return null;
    return computeSectionDiffs(leftVersion, rightVersion);
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
          onVersionChange={setLeftVersionId}
          label="Version 1"
        />
        <VersionSelector
          versions={versions}
          selectedVersionId={rightVersionId}
          onVersionChange={setRightVersionId}
          label="Version 2"
        />
      </div>

      <div className="mt-8">
        {leftVersion && rightVersion ? (
          displayMode === "visual-diff" ? (
            <VisualDiffComparison sectionDiffs={sectionDiffs || []} />
          ) : (
            <SideBySideComparison 
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
