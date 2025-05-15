
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BillVersion } from "@/types";
import VersionSelector from "@/components/version-comparison/VersionSelector";
import VisualDiffView from "@/components/version-comparison/VisualDiffView";
import SideBySideView from "@/components/version-comparison/SideBySideView";
import { Skeleton } from "@/components/ui/skeleton";

interface VersionComparisonProps {
  versions: BillVersion[];
  displayMode?: "side-by-side" | "visual-diff";
  className?: string;
}

const VersionComparison = ({ versions, displayMode = "side-by-side", className = "" }: VersionComparisonProps) => {
  const [leftVersionId, setLeftVersionId] = useState("");
  const [rightVersionId, setRightVersionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Set the default versions when the versions array changes
  useEffect(() => {
    if (versions && versions.length) {
      // Set default selections when versions load
      const firstVersionId = versions[0]?.id || "";
      const secondVersionId = versions.length > 1 ? versions[1].id : versions[0]?.id || "";
      
      setLeftVersionId(firstVersionId);
      setRightVersionId(secondVersionId);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [versions]);

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

      {isLoading ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default VersionComparison;
