
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillVersion, BillSection } from "@/types";

interface VersionComparisonProps {
  versions: BillVersion[];
  className?: string;
}

const VersionComparison = ({ versions, className = "" }: VersionComparisonProps) => {
  const [leftVersionId, setLeftVersionId] = useState(versions[0]?.id || "");
  const [rightVersionId, setRightVersionId] = useState(
    versions.length > 1 ? versions[1].id : versions[0]?.id || ""
  );

  const leftVersion = versions.find((v) => v.id === leftVersionId);
  const rightVersion = versions.find((v) => v.id === rightVersionId);

  const renderSectionComparison = (
    leftSections: BillSection[] = [],
    rightSections: BillSection[] = []
  ) => {
    // Get all unique section IDs
    const allSectionIds = Array.from(
      new Set([
        ...leftSections.map((s) => s.id),
        ...rightSections.map((s) => s.id),
      ])
    );

    return allSectionIds.map((sectionId) => {
      const leftSection = leftSections.find((s) => s.id === sectionId);
      const rightSection = rightSections.find((s) => s.id === sectionId);

      // If section exists in both versions
      if (leftSection && rightSection) {
        // Check if content is the same
        const isSameContent = leftSection.content === rightSection.content;

        return (
          <div key={sectionId} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-2">
                  {leftSection.title}
                </h3>
                <div className={`p-4 rounded-md ${!isSameContent ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p>{leftSection.content}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-2">
                  {rightSection.title}
                </h3>
                <div className={`p-4 rounded-md ${!isSameContent ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <p>{rightSection.content}</p>
                </div>
              </div>
            </div>
            {!isSameContent && (
              <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <span className="font-medium">Change 1:</span> Content has been modified between versions
              </div>
            )}
          </div>
        );
      }

      // If section only exists in left version
      if (leftSection && !rightSection) {
        return (
          <div key={sectionId} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-2">
                  {leftSection.title}
                </h3>
                <div className="p-4 rounded-md bg-red-50">
                  <p>{leftSection.content}</p>
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

      // If section only exists in right version
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
                <div className="p-4 rounded-md bg-green-50">
                  <p>{rightSection.content}</p>
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
          renderSectionComparison(leftVersion.sections, rightVersion.sections)
        ) : (
          <p className="text-muted-foreground">Select versions to compare</p>
        )}
      </div>
    </div>
  );
};

export default VersionComparison;
