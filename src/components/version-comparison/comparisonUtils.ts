
import { diffWords, diffChars } from "diff";
import { BillSection } from "@/types";
import React from "react";

/**
 * Determines if content contains HTML
 */
export const isHtmlContent = (content: string): boolean => {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
};

/**
 * Limits content size to prevent performance issues
 */
export const safeContentSize = (content: string, maxSize: number = 50000) => {
  if (content && content.length > maxSize) {
    return content.substring(0, maxSize) + 
      " ... [Content truncated to prevent performance issues]";
  }
  return content;
};

/**
 * Highlights differences between two text contents
 */
export const renderHighlightedText = (leftContent: string, rightContent: string): {
  leftHighlighted: React.ReactNode;
  rightHighlighted: React.ReactNode;
  hasDifferences: boolean;
} => {
  // Only run diff on reasonably sized content to prevent performance issues
  if (leftContent.length > 50000 || rightContent.length > 50000) {
    return {
      leftHighlighted: React.createElement("span", {}, leftContent),
      rightHighlighted: React.createElement("span", {}, rightContent),
      hasDifferences: leftContent !== rightContent
    };
  }

  // Use diffChars for character-level diff (more precise than diffWords)
  const changes = diffChars(leftContent, rightContent);

  // Process left content (removals)
  const leftHighlighted = React.createElement(
    "span",
    {},
    ...changes.map((change, i) => {
      if (change.removed || !change.added) {
        return React.createElement(
          "span",
          {
            key: i,
            className: change.removed ? "bg-red-100" : ""
          },
          change.value
        );
      }
      return null;
    }).filter(Boolean)
  );

  // Process right content (additions)
  const rightHighlighted = React.createElement(
    "span",
    {},
    ...changes.map((change, i) => {
      if (change.added || !change.removed) {
        return React.createElement(
          "span",
          {
            key: i,
            className: change.added ? "bg-green-100" : ""
          },
          change.value
        );
      }
      return null;
    }).filter(Boolean)
  );

  return { 
    leftHighlighted,
    rightHighlighted,
    hasDifferences: changes.some(c => c.added || c.removed)
  };
};

/**
 * Gets all unique section IDs from both section arrays
 */
export const getAllSectionIds = (leftSections: BillSection[], rightSections: BillSection[]) => {
  return Array.from(
    new Set([
      ...leftSections.map((s) => s.id),
      ...rightSections.map((s) => s.id),
    ])
  );
};
