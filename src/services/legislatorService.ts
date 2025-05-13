
// This file is kept for backward compatibility
// It re-exports everything from the new modular structure

import { fetchLegislatorInfo, preloadLegislatorData, getLegislatorId, getSponsorName } from './legislator';
import type { LegislatorInfo, LegislatorName } from './legislator';

export type { LegislatorInfo, LegislatorName };
export { fetchLegislatorInfo, preloadLegislatorData, getLegislatorId, getSponsorName };
