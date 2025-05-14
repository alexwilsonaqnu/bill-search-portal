
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo } from '../../types';
import { transformDbRecordToLegislatorInfo } from '../transformers';
import { createBasicLegislatorFromName } from '../fallbacks';

/**
 * Get a few sample records to help debug database issues
 */
export async function getSampleRecords(limit = 3) {
  console.log("Fetching sample records to inspect data format:");
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .limit(limit);
    
  if (error) {
    console.error("Error fetching sample data:", error.message);
    return null;
  }
  
  console.log("Sample records:", data);
  return data;
}

/**
 * Query legislator by ID
 */
export async function queryLegislatorById(legislatorId: string, cacheKey?: string): Promise<LegislatorInfo | null> {
  console.log(`Querying by ID: ${legislatorId}`);
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .eq('id', legislatorId)
    .limit(1);
  
  if (error) {
    console.warn(`Error querying by ID: ${error.message}`);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log(`No legislator found with ID: ${legislatorId}`);
    return null;
  }
  
  console.log("Found legislator by ID:", data[0].name);
  return transformDbRecordToLegislatorInfo(data[0]);
}

/**
 * Query legislator by exact name
 */
export async function queryLegislatorByExactName(sponsorName: string, cacheKey?: string): Promise<LegislatorInfo | null> {
  console.log(`Querying by exact name: "${sponsorName}"`);
  
  // First try case-sensitive match
  const { data: exactData, error: exactError } = await supabase
    .from('IL_legislators')
    .select('*')
    .eq('name', sponsorName)
    .limit(1);
    
  if (exactError) {
    console.warn(`Error querying by exact name: ${exactError.message}`);
    return null;
  }
  
  if (exactData && exactData.length > 0) {
    console.log("Found legislator by exact name (case-sensitive):", exactData[0].name);
    return transformDbRecordToLegislatorInfo(exactData[0]);
  }
  
  return null;
}

/**
 * Query legislator by case-insensitive name
 */
export async function queryLegislatorByCaseInsensitiveName(sponsorName: string, cacheKey?: string): Promise<LegislatorInfo | null> {
  console.log("Trying case-insensitive search...");
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .ilike('name', sponsorName)
    .limit(1);
    
  if (error) {
    console.warn(`Error querying by case-insensitive name: ${error.message}`);
    return null;
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  console.log("Found legislator by case-insensitive name:", data[0].name);
  return transformDbRecordToLegislatorInfo(data[0]);
}

/**
 * Query legislator by first and last name
 */
export async function queryLegislatorByNameParts(firstName: string, lastName: string): Promise<LegislatorInfo | null> {
  console.log(`Searching with firstName="${firstName}", lastName="${lastName}"`);
  
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .eq('given_name', firstName)
    .eq('family_name', lastName)
    .limit(1);
    
  if (error) {
    console.warn(`Error querying by name parts: ${error.message}`);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log("No match found with given_name and family_name");
    return null;
  }
  
  console.log("Found legislator by first+last name:", data[0].name);
  return transformDbRecordToLegislatorInfo(data[0]);
}

/**
 * Query legislator by flexible name search (with wildcards)
 */
export async function queryLegislatorByFlexibleName(sponsorName: string): Promise<LegislatorInfo | null> {
  console.log(`Trying flexible name search for: "${sponsorName}"`);
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .ilike('name', `%${sponsorName}%`)
    .limit(1);
    
  if (error) {
    console.warn(`Error in flexible name search: ${error.message}`);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log("No flexible name match found");
    return null;
  }
  
  console.log("Found legislator by flexible name search:", data[0].name);
  return transformDbRecordToLegislatorInfo(data[0]);
}

/**
 * Query legislator by last name only
 */
export async function queryLegislatorByLastName(lastName: string): Promise<LegislatorInfo | null> {
  console.log(`Trying family_name search for: "${lastName}"`);
  
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .ilike('family_name', `%${lastName}%`)
    .limit(1);
    
  if (error) {
    console.warn(`Error querying by last name: ${error.message}`);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log("No match found with family_name");
    return null;
  }
  
  console.log("Found legislator by family name:", data[0].name);
  return transformDbRecordToLegislatorInfo(data[0]);
}

/**
 * Check if the legislators table exists and has data
 */
export async function checkLegislatorsTableStatus(): Promise<number | null> {
  console.log("Checking il_legislators table status...");
  const { count, error } = await supabase
    .from('IL_legislators')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error("Error checking table:", error.message);
    return null;
  }
  
  console.log(`il_legislators table contains ${count} records`);
  return count;
}

/**
 * Get any record from the legislators table (for debugging)
 */
export async function getAnyLegislator(): Promise<any> {
  console.log(`Last resort: querying any record from the table`);
  const { data, error } = await supabase
    .from('IL_legislators')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error in last resort query:", error.message);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log("No records found in il_legislators at all");
    return null;
  }
  
  console.log("Found a legislator record:", data[0]);
  return data[0];
}
