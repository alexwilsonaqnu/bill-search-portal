
import { LegislatorInfo } from '../types';

/**
 * Transform Supabase database record to LegislatorInfo format
 */
export function transformDbRecordToLegislatorInfo(record: any): LegislatorInfo {
  // Build name object
  const nameParts = {
    first: record.given_name || '',
    middle: '', // Middle name not in schema
    last: record.family_name || '',
    suffix: '',
    full: record.name || `${record.given_name || ''} ${record.family_name || ''}`.trim()
  };
  
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
  
  return {
    party: record.current_party || '',
    email: emailArray,
    phone: phoneArray,
    district: record.current_district ? record.current_district.toString() : '',
    role: record.current_chamber === 'upper' ? 'Senator' : 
          record.current_chamber === 'lower' ? 'Representative' : 
          'Legislator',
    name: nameParts,
    office: record.capitol_address || '',
    state: 'IL' // Since this is specific to Illinois legislators
  };
}
