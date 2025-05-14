
/**
 * Simple Legislator Service
 * Streamlined implementation focused on direct database access with better type safety
 */

// Export core types
export type { LegislatorInfo, LegislatorName, LegislatorSearchOptions } from './types';

// Export API functions
export {
  fetchLegislator,
  fetchMultipleLegislators,
  searchLegislators, 
  searchLegislatorDebounced,
  preloadLegislatorData,
  clearLegislatorCache
} from './api';

// Export utility functions
export { 
  getLegislatorId, 
  getSponsorName 
} from './utils';

// Export cache functions
export { 
  clearCache as clearLegislatorCache
} from './cache';
