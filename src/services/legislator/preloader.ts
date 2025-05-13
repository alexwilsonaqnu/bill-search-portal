
import { fetchLegislatorInfo, fetchMultipleLegislators } from './api';

/**
 * Preload legislator data for a list of sponsors
 * This function fetches legislator data in the background
 * and stores it in the cache for later use
 */
export async function preloadLegislatorData(sponsors: any[]): Promise<void> {
  if (!sponsors || sponsors.length === 0) return;
  
  try {
    console.log(`Preloading data for ${sponsors.length} legislators...`);
    
    // Extract IDs from sponsors when available
    const legislatorIds = sponsors
      .map(sponsor => {
        // Handle different sponsor data formats
        if (sponsor?.people_id) return sponsor.people_id;
        if (sponsor?.sponsor?.people_id) return sponsor.sponsor.people_id;
        if (sponsor?.legislator_id) return sponsor.legislator_id;
        if (sponsor?.id) return sponsor.id;
        return null;
      })
      .filter(Boolean);
    
    // Use batch fetch if we have IDs
    if (legislatorIds.length > 0) {
      console.log(`Batch fetching ${legislatorIds.length} legislators by ID`);
      await fetchMultipleLegislators(legislatorIds);
      return;
    }
    
    // Fallback to fetching by name
    const maxConcurrent = 3; // Limit concurrent requests
    const chunks = [];
    
    // Split sponsors into chunks to limit concurrent requests
    for (let i = 0; i < sponsors.length; i += maxConcurrent) {
      chunks.push(sponsors.slice(i, i + maxConcurrent));
    }
    
    // Process chunks sequentially
    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (sponsor) => {
        try {
          // Extract sponsor name
          let name = '';
          if (typeof sponsor === 'string') {
            name = sponsor;
          } else if (sponsor?.name) {
            name = sponsor.name;
          } else if (sponsor?.sponsor?.name) {
            name = sponsor.sponsor.name;
          }
          
          if (name) {
            await fetchLegislatorInfo(undefined, name);
          }
        } catch (error) {
          // Silently ignore errors during preloading
          console.log(`Failed to preload legislator: ${error.message}`);
        }
      }));
      
      // Small delay between chunks to prevent overloading
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    // Log but don't throw errors during preloading
    console.error("Error during legislator preloading:", error);
  }
}
