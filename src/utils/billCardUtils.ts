
import { Bill } from "@/types";

/**
 * Format the title of a bill for display
 */
export const formatTitle = (bill: Bill): string => {
  if (bill.title && bill.title.length > 10 && !bill.title.includes(bill.id)) {
    return bill.title;
  }
  
  const firstSentence = bill.description?.split('.')?.filter(s => s.trim().length > 0)?.[0];
  if (firstSentence && firstSentence.length > 10) {
    return firstSentence;
  }
  
  return `${bill.title || bill.id} - Legislative Proposal`;
};

/**
 * Get summary text from bill description
 */
export const getSummary = (bill: Bill): string => {
  if (!bill.description) return "No description available";
  
  const sentences = bill.description.split('.').filter(s => s.trim().length > 0);
  if (sentences.length > 1) {
    const remainingSentences = sentences.slice(1).join('. ');
    if (remainingSentences.length > 150) {
      return remainingSentences.substring(0, 150) + "...";
    }
    return remainingSentences;
  }
  
  if (bill.description.length > 150) {
    return bill.description.substring(0, 150) + "...";
  }
  
  return bill.description;
};

/**
 * Get the primary sponsor of a bill
 */
export const getSponsor = (bill: Bill): string | null => {
  if (bill.data?.sponsor) return bill.data.sponsor;
  if (bill.data?.author) return bill.data.author;
  if (bill.data?.sponsors && bill.data.sponsors.length > 0) {
    return Array.isArray(bill.data.sponsors) 
      ? bill.data.sponsors[0] 
      : bill.data.sponsors;
  }
  return null;
};

/**
 * Get co-sponsors for a bill (up to 3)
 */
export const getCoSponsors = (bill: Bill): string[] => {
  if (!bill.data) return [];
  
  const possibleFields = ['cosponsors', 'co_sponsors', 'coSponsors', 'co-sponsors'];
  
  for (const field of possibleFields) {
    if (bill.data[field] && Array.isArray(bill.data[field]) && bill.data[field].length > 0) {
      return bill.data[field].slice(0, 3);
    }
  }
  
  return [];
};

/**
 * Get the most relevant date for a bill
 */
export const getRelevantDate = (bill: Bill): string => {
  if (bill.lastUpdated) return bill.lastUpdated;
  if (bill.data?.introducedDate) return bill.data.introducedDate;
  if (bill.data?.lastActionDate) return bill.data.lastActionDate;
  return "N/A";
};

/**
 * Get the most recent action taken on a bill
 */
export const getMostRecentAction = (bill: Bill): string | null => {
  if (!bill.data) return null;
  
  const possibleFields = ['lastAction', 'last_action', 'recentAction', 'recent_action', 'latestAction'];
  
  for (const field of possibleFields) {
    if (bill.data[field] && typeof bill.data[field] === 'string') {
      return bill.data[field];
    }
    
    if (bill.data[field] && typeof bill.data[field] === 'object') {
      const actionObj = bill.data[field];
      if (actionObj.description || actionObj.text || actionObj.action) {
        return actionObj.description || actionObj.text || actionObj.action;
      }
    }
  }
  
  return null;
};

/**
 * Get the type of the most recent action
 */
export const getActionType = (bill: Bill): string | null => {
  if (!bill.data) return null;
  
  const possibleFields = ['actionType', 'action_type', 'type', 'lastActionType'];
  
  for (const field of possibleFields) {
    if (bill.data[field] && typeof bill.data[field] === 'string') {
      return bill.data[field];
    }
  }
  
  return null;
};

/**
 * Get tags/topics for a bill (up to 2)
 */
export const getTags = (bill: Bill): string[] => {
  if (!bill.data) return [];
  
  const possibleTagFields = ['topics', 'categories', 'tags', 'subjects'];
  for (const field of possibleTagFields) {
    if (bill.data[field] && Array.isArray(bill.data[field]) && bill.data[field].length > 0) {
      return bill.data[field].slice(0, 2);
    }
  }
  
  return [];
};

/**
 * Get the first three lines of the bill's content
 */
export const getFirstThreeLines = (bill: Bill): string | null => {
  if (!bill.versions || bill.versions.length === 0 || !bill.versions[0].sections || bill.versions[0].sections.length === 0) {
    return null;
  }
  
  const firstContent = bill.versions[0].sections.find(section => section.content)?.content;
  
  if (!firstContent) return null;
  
  const lines = firstContent.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return null;
  
  const firstThreeLines = lines.slice(0, 3).join('\n');
  return firstThreeLines;
};
