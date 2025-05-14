
// This file exports debug utilities for legislator operations
export { searchLegislatorDebug } from './searchDebug';
export { checkILLegislatorsTable } from './tableDiagnostics';

// Create a namespace export for backward compatibility
export const debugUtils = {
  searchLegislator: searchLegislatorDebug,
  checkILLegislatorsTable
};
