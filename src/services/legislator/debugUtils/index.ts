
// This file exports debug utilities for legislator operations
import { searchLegislatorDebug } from './searchDebug';
import { checkILLegislatorsTable } from './tableDiagnostics';

export { searchLegislatorDebug, checkILLegislatorsTable };

// Create a namespace export for backward compatibility
export const debugUtils = {
  searchLegislator: searchLegislatorDebug,
  checkILLegislatorsTable
};
