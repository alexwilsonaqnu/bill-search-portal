
/**
 * API module index
 * Re-exports functionality from the modularized files
 */
export { fetchLegislator } from './fetchSingle';
export { fetchMultipleLegislators } from './fetchBatch';
export { searchLegislators } from './search';
export { preloadLegislatorData } from './preloader';
export { searchLegislatorDebounced } from './debounce';
