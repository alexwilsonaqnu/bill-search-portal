
// This file is kept for backward compatibility
// It re-exports everything from the new modular structure

import { fetchLegislatorInfo, searchLegislatorDebounced as searchLegislator, fetchMultipleLegislators } from './legislator/api';
import { getLegislatorId, getSponsorName } from './legislator/utils';
import { preloadLegislatorData } from './legislator/preloader';
import type { LegislatorInfo, LegislatorName } from './legislator/types';

export type { LegislatorInfo, LegislatorName };
export { fetchLegislatorInfo, preloadLegislatorData, getLegislatorId, getSponsorName, searchLegislator, fetchMultipleLegislators };
