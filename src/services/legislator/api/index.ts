
import { fetchLegislatorInfo, fetchMultipleLegislators } from './core';
import { createBasicLegislatorFromName } from './fallbacks';
import { transformDbRecordToLegislatorInfo } from './transformers';
import { debounce } from './debounce';

// Export a debounced version for search operations (300ms delay)
export const searchLegislatorDebounced = debounce(
  (sponsorName: string) => fetchLegislatorInfo(undefined, sponsorName),
  300
);

export {
  fetchLegislatorInfo,
  fetchMultipleLegislators,
  createBasicLegislatorFromName,
  transformDbRecordToLegislatorInfo
};
