
import React from "react";
import { BillSection } from "@/types";
import { getAllSectionIds } from "../utils/contentUtils";
import SectionModifiedView from "../diff/SectionModifiedView";
import SectionAddedView from "../diff/SectionAddedView";
import SectionRemovedView from "../diff/SectionRemovedView";

interface SideBySideViewProps {
  leftSections: BillSection[];
  rightSections: BillSection[];
}

const SideBySideView = ({ leftSections = [], rightSections = [] }: SideBySideViewProps) => {
  const allSectionIds = getAllSectionIds(leftSections, rightSections);

  return (
    <>
      {allSectionIds.map((sectionId) => {
        const leftSection = leftSections.find((s) => s.id === sectionId);
        const rightSection = rightSections.find((s) => s.id === sectionId);
        
        if (leftSection && rightSection) {
          return (
            <div key={sectionId} className="mb-8">
              <SectionModifiedView 
                leftSection={leftSection} 
                rightSection={rightSection} 
              />
            </div>
          );
        }

        if (leftSection && !rightSection) {
          return (
            <div key={sectionId} className="mb-8">
              <SectionRemovedView section={leftSection} />
              <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <span className="font-medium">Change:</span> Section removed in newer version
              </div>
            </div>
          );
        }

        if (!leftSection && rightSection) {
          return (
            <div key={sectionId} className="mb-8">
              <SectionAddedView section={rightSection} />
              <div className="mt-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <span className="font-medium">Change:</span> New section added in newer version
              </div>
            </div>
          );
        }

        return null;
      })}
    </>
  );
};

export default SideBySideView;
