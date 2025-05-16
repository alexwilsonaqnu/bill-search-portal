
import { useMemo } from "react";
import { BillVersion } from "@/types";
import VisualDiffSectionView from "../diff/VisualDiffSectionView";
import NoDifferencesMessage from "../diff/NoDifferencesMessage";
import { generateSectionDiffs } from "../utils/diffUtils";

interface VisualDiffViewProps {
  leftVersion: BillVersion | undefined;
  rightVersion: BillVersion | undefined;
}

const VisualDiffView = ({ leftVersion, rightVersion }: VisualDiffViewProps) => {
  const sectionDiffs = useMemo(() => {
    return generateSectionDiffs(leftVersion, rightVersion);
  }, [leftVersion, rightVersion]);

  if (!sectionDiffs || !sectionDiffs.length) {
    return <NoDifferencesMessage />;
  }

  return (
    <>
      {sectionDiffs.map((diff) => (
        <VisualDiffSectionView key={diff.id} {...diff} />
      ))}
    </>
  );
};

export default VisualDiffView;
