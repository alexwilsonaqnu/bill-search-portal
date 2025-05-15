
import { BillVersion } from "@/types";

/**
 * Validates that versions have content
 */
export const validateVersionsHaveContent = (versions: BillVersion[]): string | null => {
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

/**
 * Sets default version selections
 */
export const getDefaultVersionSelections = (versions: BillVersion[]): {
  firstVersionId: string;
  secondVersionId: string;
} => {
  if (!versions || versions.length === 0) {
    return { firstVersionId: "", secondVersionId: "" };
  }
  
  const firstVersionId = versions[0]?.id || "";
  const secondVersionId = versions.length > 1 ? versions[1].id : versions[0]?.id || "";
  
  return { firstVersionId, secondVersionId };
};
