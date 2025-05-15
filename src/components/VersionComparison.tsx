
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BillVersion } from "@/types";
import VersionSelector from "@/components/version-comparison/VersionSelector";
import VisualDiffView from "@/components/version-comparison/VisualDiffView";
import SideBySideView from "@/components/version-comparison/SideBySideView";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface VersionComparisonProps {
  versions: BillVersion[];
  displayMode?: "side-by-side" | "visual-diff";
  className?: string;
}

const VersionComparison = ({ versions, displayMode = "side-by-side", className = "" }: VersionComparisonProps) => {
  const [leftVersionId, setLeftVersionId] = useState("");
  const [rightVersionId, setRightVersionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  
  // Set the default versions when the versions array changes
  useEffect(() => {
    if (versions && versions.length) {
      // Set default selections when versions load
      const firstVersionId = versions[0]?.id || "";
      const secondVersionId = versions.length > 1 ? versions[1].id : versions[0]?.id || "";
      
      setLeftVersionId(firstVersionId);
      setRightVersionId(secondVersionId);
      
      // Check if versions have content
      const noContentWarning = validateVersionsHaveContent(versions);
      setContentWarning(noContentWarning);
      
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [versions]);

  const validateVersionsHaveContent = (versions: BillVersion[]): string | null => {
    if (!versions || versions.length === 0) return "No versions available";
    
    // Check the first two versions which are typically selected by default
    const versionsToCheck = versions.slice(0, Math.min(2, versions.length));
    
    const versionsWithoutContent = versionsToCheck.filter(version => {
      return !version.sections || !version.sections.some(section => 
        section.content && section.content.trim().length > 0
      );
    });
    
    if (versionsWithoutContent.length > 0) {
      const missingContentVersions = versionsWithoutContent.map(v => v.name).join(", ");
      return `Missing content in versions: ${missingContentVersions}`;
    }
    
    return null;
  };

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

      {contentWarning && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm flex items-start">
          <AlertCircle className="text-amber-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Content Warning</p>
            <p className="text-amber-700">{contentWarning}</p>
          </div>
        </div>
      )}

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
