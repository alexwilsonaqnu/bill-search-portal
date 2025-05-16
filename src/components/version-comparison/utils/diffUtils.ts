
import { BillVersion, BillSection } from "@/types";
import { diffWords } from "diff";
import { isHtmlContent, safeContentSize } from "./contentUtils";

export interface SectionDiff {
  id: string;
  leftTitle: string | null;
  rightTitle: string | null;
  changes?: any[];
  leftContent?: string;
  rightContent?: string;
  content?: string;
  onlyInLeft: boolean;
  onlyInRight: boolean;
  isTooLarge?: boolean;
  isHtml: boolean;
}

/**
 * Generates section diffs between two bill versions
 */
export const generateSectionDiffs = (
  leftVersion?: BillVersion,
  rightVersion?: BillVersion
): SectionDiff[] | null => {
  if (!leftVersion || !rightVersion) return null;

  const leftSectionsMap = new Map(leftVersion.sections.map(s => [s.id, s]));
  const rightSectionsMap = new Map(rightVersion.sections.map(s => [s.id, s]));
  
  const allSectionIds = Array.from(
    new Set([...leftSectionsMap.keys(), ...rightSectionsMap.keys()])
  );

  return allSectionIds.map(sectionId => {
    const leftSection = leftSectionsMap.get(sectionId);
    const rightSection = rightSectionsMap.get(sectionId);
    
    const MAX_CONTENT_LENGTH = 20000;
    const safeContent = (content: string) => safeContentSize(content, MAX_CONTENT_LENGTH);
    
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
      
      const leftContent = safeContent(leftSection.content);
      const rightContent = safeContent(rightSection.content);
      
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
        content: safeContent(leftSection.content),
        onlyInLeft: true,
        onlyInRight: false,
        isHtml: leftIsHtml
      };
    } else if (rightSection) {
      return {
        id: sectionId,
        leftTitle: null,
        rightTitle: rightSection.title,
        content: safeContent(rightSection.content),
        onlyInLeft: false,
        onlyInRight: true,
        isHtml: rightIsHtml
      };
    }
    
    return null;
  }).filter(Boolean) as SectionDiff[];
};
