
import { LegislatorInfo } from '../../types';
import { cacheLegislator } from '../../cache';
import { createBasicLegislatorFromName } from '../fallbacks';
import * as dbQueries from './dbQueries';

/**
 * Search by legislator ID
 */
export async function searchById(legislatorId: string, cacheKey: string): Promise<LegislatorInfo | null> {
  const result = await dbQueries.queryLegislatorById(legislatorId, cacheKey);
  
  if (result) {
    cacheLegislator(cacheKey, result);
    return result;
  }
  
  return null;
}

/**
 * Search by legislator name using multiple strategies
 */
export async function searchByName(sponsorName: string, cacheKey: string): Promise<LegislatorInfo | null> {
  // Strategy 1: Exact name match (case-sensitive)
  const exactMatch = await dbQueries.queryLegislatorByExactName(sponsorName, cacheKey);
  if (exactMatch) {
    cacheLegislator(cacheKey, exactMatch);
    return exactMatch;
  }
  
  // Strategy 2: Case-insensitive name match
  const caseInsensitiveMatch = await dbQueries.queryLegislatorByCaseInsensitiveName(sponsorName, cacheKey);
  if (caseInsensitiveMatch) {
    cacheLegislator(cacheKey, caseInsensitiveMatch);
    return caseInsensitiveMatch;
  }
  
  // Strategy 3: First name + last name
  const nameParts = sponsorName.trim().split(' ');
  if (nameParts.length > 1) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    const namePartsMatch = await dbQueries.queryLegislatorByNameParts(firstName, lastName);
    if (namePartsMatch) {
      cacheLegislator(cacheKey, namePartsMatch);
      return namePartsMatch;
    }
  }
  
  // Strategy 4: Flexible name search with wildcards
  const flexibleMatch = await dbQueries.queryLegislatorByFlexibleName(sponsorName);
  if (flexibleMatch) {
    cacheLegislator(cacheKey, flexibleMatch);
    return flexibleMatch;
  }
  
  // Strategy 5: Match only on family name as last resort
  if (nameParts.length > 0) {
    const lastName = nameParts[nameParts.length - 1];
    const lastNameMatch = await dbQueries.queryLegislatorByLastName(lastName);
    if (lastNameMatch) {
      cacheLegislator(cacheKey, lastNameMatch);
      return lastNameMatch;
    }
  }
  
  // Last resort: Create fallback data
  console.log(`No match found for "${sponsorName}", creating fallback data`);
  const fallback = createBasicLegislatorFromName(sponsorName);
  cacheLegislator(cacheKey, fallback);
  return fallback;
}

/**
 * Verify that the legislators table has data
 */
export async function verifyTableHasData(): Promise<boolean> {
  const count = await dbQueries.checkLegislatorsTableStatus();
  if (count === null) {
    return false; // Error checking table
  }
  
  return count > 0;
}
