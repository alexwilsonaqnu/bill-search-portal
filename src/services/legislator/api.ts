
// This file is maintained for backward compatibility
// It re-exports everything from the reorganized api modules

export { 
  fetchLegislatorInfo,
  fetchMultipleLegislators,
  searchLegislatorDebounced,
  createBasicLegislatorFromName,
  transformDbRecordToLegislatorInfo
} from './api/index';
