
import { LegislatorInfo } from '../types';

/**
 * Create a basic legislator object from just the name
 */
export function createBasicLegislatorFromName(name: string): LegislatorInfo {
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Try to extract party information if present in parentheses
  let party = '';
  if (name.includes('(D)')) party = 'Democratic';
  else if (name.includes('(R)')) party = 'Republican';
  else if (name.includes('(I)')) party = 'Independent';
  
  // Try to extract role
  let role = 'Legislator';
  if (name.toLowerCase().includes('rep.') || name.toLowerCase().includes('representative')) {
    role = 'Representative';
  } else if (name.toLowerCase().includes('sen.') || name.toLowerCase().includes('senator')) {
    role = 'Senator';
  }
  
  return {
    name: {
      first: firstName,
      middle: '',
      last: lastName,
      suffix: '',
      full: name.replace(/\s*\([^)]*\)/g, '').trim() // Remove party/district info in parentheses
    },
    party,
    email: [],
    phone: [],
    district: '',
    role,
    office: '',
    state: 'IL'
  };
}
