
import { fetchLegislator } from './fetchSingle';
import { getLegislatorId, getSponsorName } from '../utils';

/**
 * Preload legislator data for a list of sponsors
 */
export function preloadLegislatorData(sponsors: any[]): void {
  if (!sponsors || sponsors.length === 0) return;
  
  // Extract IDs where possible
  const sponsorData = sponsors.map(sponsor => ({
    id: getLegislatorId(sponsor),
    name: typeof sponsor === 'string' ? sponsor : getSponsorName(sponsor)
  }));
  
  // Fetch in the background without awaiting
  setTimeout(() => {
    sponsorData.forEach(async (sponsor) => {
      if (sponsor.id) {
        fetchLegislator(sponsor.id);
      } else if (sponsor.name) {
        fetchLegislator(undefined, sponsor.name);
      }
    });
  }, 0);
}
