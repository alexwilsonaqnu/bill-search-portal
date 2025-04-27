
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
 * Get the primary sponsor of the bill
 * Handles all possible data structures
 */
export function getSponsor(bill: Bill): string | Record<string, any> | null {
  if (!bill || !bill.data) return null;
  
  // Try all possible sponsor locations in the data
  
  // First try to get from data.sponsors.primary if available
  if (bill.data.sponsors?.primary) {
    return bill.data.sponsors.primary;
  }
  
  // Check for direct sponsor property
  if (bill.data.sponsor) {
    // Handle circular reference in sponsor
    if (Array.isArray(bill.data.sponsors) && bill.data.sponsors.length > 0) {
      const firstSponsor = bill.data.sponsors[0];
      if (firstSponsor && typeof firstSponsor === 'object' && firstSponsor.message && 
          firstSponsor.message.includes('Circular Reference')) {
        return bill.data.sponsor;
      }
    }
    return bill.data.sponsor;
  }
  
  // Check for author property
  if (bill.data.author) {
    return bill.data.author;
  }
  
  // Check if sponsors array exists and get first item
  if (Array.isArray(bill.data.sponsors) && bill.data.sponsors.length > 0) {
    const firstSponsor = bill.data.sponsors[0];
    
    // Handle circular reference
    if (firstSponsor && typeof firstSponsor === 'object' && firstSponsor.message && 
        firstSponsor.message.includes('Circular Reference')) {
      if (bill.data.sponsor) {
        return bill.data.sponsor;
      }
    }
    
    return firstSponsor;
  }
  
  // Check if sponsors is an object with a sponsor property
  if (typeof bill.data.sponsors === 'object' && bill.data.sponsors?.sponsor) {
    return bill.data.sponsors.sponsor;
  }
  
  return null;
}

/**
 * Get co-sponsors of the bill
 * Handles all possible data structures
 */
export function getCoSponsors(bill: Bill): (string | Record<string, any>)[] {
  if (!bill || !bill.data) return [];
  
  // Try all possible cosponsor locations in the data
  
  // First check for cosponsors array, get all of them if available
  if (Array.isArray(bill.data.cosponsors)) {
    return bill.data.cosponsors;
  }
  
  // Then check for sponsors.cosponsors array
  if (Array.isArray(bill.data.sponsors?.cosponsors)) {
    return bill.data.sponsors.cosponsors;
  }
  
  // Check for co_sponsors array
  if (Array.isArray(bill.data.co_sponsors)) {
    return bill.data.co_sponsors;
  }
  
  // Check for coSponsors array
  if (Array.isArray(bill.data.coSponsors)) {
    return bill.data.coSponsors;
  }
  
  // Check if sponsors is an array and get items beyond the first one
  if (Array.isArray(bill.data.sponsors) && bill.data.sponsors.length > 1) {
    return bill.data.sponsors.slice(1);
  }
  
  return [];
}

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
