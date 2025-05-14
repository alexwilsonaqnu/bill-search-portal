
// Re-export from the legacy implementation for backward compatibility
export { 
  fetchLegislatorInfo, 
  fetchMultipleLegislators, 
  searchLegislatorDebounced,
  clearCache
} from './api';
export { preloadLegislatorData } from './preloader';
export { getLegislatorId, getSponsorName } from './utils';
export { debugUtils } from './debugUtils';
export type { LegislatorInfo, LegislatorName } from './types';

// Export the new simplified implementation
export * as legislatorSimple from './simple';
