
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BillVersion } from "@/types";
import VersionSelector from "@/components/version-comparison/VersionSelector";
import VisualDiffView from "@/components/version-comparison/VisualDiffView";
import SideBySideView from "@/components/version-comparison/SideBySideView";

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

  if (!versions.length) {
    return (
      <Card className={`p-6 ${className}`}>
        <p className="text-muted-foreground">No versions available for comparison.</p>
      </Card>
    );
  }

  return (
    <div className={className}>
      <VersionSelector
        versions={versions}
        leftVersionId={leftVersionId}
        rightVersionId={rightVersionId}
        setLeftVersionId={setLeftVersionId}
        setRightVersionId={setRightVersionId}
      />

      <div className="mt-8">
        {leftVersion && rightVersion ? (
          displayMode === "visual-diff" ? (
            <VisualDiffView leftVersion={leftVersion} rightVersion={rightVersion} />
          ) : (
            <SideBySideView leftSections={leftVersion.sections} rightSections={rightVersion.sections} />
          )
        ) : (
          <p className="text-muted-foreground">Select versions to compare</p>
        )}
      </div>
    </div>
  );
};

export default VersionComparison;
