
// Re-export all components from the service
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
