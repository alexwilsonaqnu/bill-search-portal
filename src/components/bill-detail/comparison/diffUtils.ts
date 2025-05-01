
import { diffWords, diffChars } from "diff";
import { BillSection } from "@/types";

/**
 * Determines if content is HTML based on simple tag detection
 */
export const isHtmlContent = (content: string): boolean => {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
};

/**
 * Truncates content if it exceeds a certain size to prevent performance issues
 */
export const safeContentSize = (content: string, maxLength: number = 50000) => {
  if (content && content.length > maxLength) {
    return content.substring(0, maxLength) + 
      " ... [Content truncated to prevent performance issues]";
  }
  return content;
};

/**
 * Highlights differences between two text contents
 */
export const renderHighlightedText = (leftContent: string, rightContent: string) => {
  // Only run diff on reasonably sized content to prevent performance issues
  if (leftContent.length > 50000 || rightContent.length > 50000) {
    return {
      leftHighlighted: <span>{leftContent}</span>,
      rightHighlighted: <span>{rightContent}</span>,
      hasDifferences: leftContent !== rightContent
    };
  }

  // Use diffChars for character-level diff (more precise than diffWords)
  const changes = diffChars(leftContent, rightContent);

  // Process left content (removals)
  const leftHighlighted = (
    <span>
      {changes.map((change, i) => {
        if (change.removed || !change.added) {
          return (
            <span 
              key={i} 
              className={change.removed ? "bg-red-100" : ""}
            >
              {change.value}
            </span>
          );
        }
        return null;
      })}
    </span>
  );

  // Process right content (additions)
  const rightHighlighted = (
    <span>
      {changes.map((change, i) => {
        if (change.added || !change.removed) {
          return (
            <span 
              key={i} 
              className={change.added ? "bg-green-100" : ""}
            >
              {change.value}
            </span>
          );
        }
        return null;
      })}
    </span>
  );

  return { 
    leftHighlighted,
    rightHighlighted,
    hasDifferences: changes.some(c => c.added || c.removed)
  };
};

/**
 * Computes differences between sections for visual diff
 */
export const computeSectionDiffs = (leftVersion: any, rightVersion: any) => {
  if (!leftVersion || !rightVersion) return null;

  const leftSectionsMap = new Map(leftVersion.sections.map((s: BillSection) => [s.id, s]));
  const rightSectionsMap = new Map(rightVersion.sections.map((s: BillSection) => [s.id, s]));
  
  const allSectionIds = Array.from(
    new Set([...leftSectionsMap.keys(), ...rightSectionsMap.keys()])
  );

  return allSectionIds.map(sectionId => {
    const leftSection = leftSectionsMap.get(sectionId);
    const rightSection = rightSectionsMap.get(sectionId);
    
    const safeSize = (content: string) => safeContentSize(content, 20000);
    
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
      
      const leftContent = safeSize(leftSection.content);
      const rightContent = safeSize(rightSection.content);
      
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
        content: safeSize(leftSection.content),
        onlyInLeft: true,
        onlyInRight: false,
        isHtml: leftIsHtml
      };
    } else if (rightSection) {
      return {
        id: sectionId,
        leftTitle: null,
        rightTitle: rightSection.title,
        content: safeSize(rightSection.content),
        onlyInLeft: false,
        onlyInRight: true,
        isHtml: rightIsHtml
      };
    }
    
    return null;
  }).filter(Boolean);
};
