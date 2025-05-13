
// Re-export all components from the service
export { fetchLegislatorInfo, fetchMultipleLegislators, searchLegislatorDebounced } from './api';
export { preloadLegislatorData } from './preloader';
export { getLegislatorId, getSponsorName } from './utils';
export type { LegislatorInfo, LegislatorName } from './types';
