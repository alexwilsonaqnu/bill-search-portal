
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
  if (!content) return "No content available";
  
  if (content.length > maxSize) {
    console.warn(`Content truncated from ${content.length} to ${maxSize} characters`);
    return content.substring(0, maxSize) + 
      " ... [Content truncated to prevent performance issues]";
  }
  return content;
};

/**
 * Checks if the content is meaningful (not empty or placeholder)
 */
export const hasValidContent = (content: string): boolean => {
  if (!content) return false;
  
  const trimmedContent = content.trim();
  if (trimmedContent.length < 10) return false;
  
  const placeholderTexts = [
    "no content available",
    "could not load",
    "error loading",
    "not available",
    "no text content"
  ];
  
  return !placeholderTexts.some(placeholder => 
    trimmedContent.toLowerCase().includes(placeholder)
  );
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

/**
 * Highlights differences between two text contents
 */
export const renderHighlightedText = (leftContent: string, rightContent: string): {
  leftHighlighted: React.ReactNode;
  rightHighlighted: React.ReactNode;
  hasDifferences: boolean;
} => {
  // Handle null or undefined content
  const safeLeftContent = leftContent || "No content available";
  const safeRightContent = rightContent || "No content available";
  
  // Only run diff on reasonably sized content to prevent performance issues
  if (safeLeftContent.length > 50000 || safeRightContent.length > 50000) {
    console.warn("Content too large for diff, skipping highlighting");
    return {
      leftHighlighted: React.createElement("span", {}, safeLeftContent),
      rightHighlighted: React.createElement("span", {}, safeRightContent),
      hasDifferences: safeLeftContent !== safeRightContent
    };
  }

  // Use diffChars for character-level diff (more precise than diffWords)
  const changes = diffChars(safeLeftContent, safeRightContent);

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
