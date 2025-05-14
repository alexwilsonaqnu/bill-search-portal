
import { LegislatorInfo } from '../types';

/**
 * Transform Supabase database record to LegislatorInfo format
 */
export function transformDbRecordToLegislatorInfo(record: any): LegislatorInfo {
  // Check for null or empty record
  if (!record || Object.keys(record).length === 0) {
    console.warn('Empty record provided to transformDbRecordToLegislatorInfo');
    return createEmptyLegislatorInfo();
  }
  
  // Build name object
  const nameParts = {
    first: record.given_name || '',
    middle: '', // Middle name not in schema
    last: record.family_name || '',
    suffix: '',
    full: record.name || `${record.given_name || ''} ${record.family_name || ''}`.trim()
  };
  
  // If we have no name at all, add a placeholder
  if (!nameParts.full) {
    nameParts.full = 'Unknown Legislator';
  }
  
  // Format email and phone as arrays
  const emailArray = record.email ? [record.email] : [];
  const phoneArray = [];
  
  // Add capitol phone if available
  if (record.capitol_voice) {
    phoneArray.push(record.capitol_voice);
  }
  
  // Add district phone if available and different
  if (record.district_voice && record.district_voice !== record.capitol_voice) {
    phoneArray.push(record.district_voice);
  }
  
  const result: LegislatorInfo = {
    party: record.current_party || '',
    email: emailArray,
    phone: phoneArray,
    district: record.current_district ? record.current_district.toString() : '',
    role: getRoleName(record.current_chamber),
    name: nameParts,
    office: record.capitol_address || '',
    state: 'IL' // Since this is specific to Illinois legislators
  };
  
  return result;
}

/**
 * Get a human-readable role name from chamber value
 */
function getRoleName(chamber?: string): string {
  if (!chamber) return 'Legislator';
  
  switch(chamber.toLowerCase()) {
    case 'upper':
      return 'Senator';
    case 'lower':
      return 'Representative';
    default:
      return 'Legislator';
  }
}

/**
 * Create empty legislator info object for fallback
 */
function createEmptyLegislatorInfo(): LegislatorInfo {
  return {
    name: {
      first: '',
      middle: '',
      last: '',
      suffix: '',
      full: 'Unknown Legislator'
    },
    party: '',
    email: [],
    phone: [],
    district: '',
    role: 'Legislator',
    state: 'IL'
  };
}
