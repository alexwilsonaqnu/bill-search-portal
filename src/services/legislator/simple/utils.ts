
/**
 * Extract a legislator's name from sponsor data
 */
export function getSponsorName(sponsorData: any): string {
  if (typeof sponsorData === 'string') return sponsorData;
  if (!sponsorData) return 'Unknown';
  
  // Handle common data patterns
  if (typeof sponsorData.name === 'string') return sponsorData.name;
  if (typeof sponsorData.full_name === 'string') return sponsorData.full_name;
  
  // Try to construct from name parts
  const nameParts = [];
  if (sponsorData.first_name) nameParts.push(sponsorData.first_name);
  if (sponsorData.middle_name) nameParts.push(sponsorData.middle_name);
  if (sponsorData.last_name) nameParts.push(sponsorData.last_name);
  
  if (nameParts.length > 0) {
    const fullName = nameParts.join(' ');
    if (sponsorData.suffix) return `${fullName}, ${sponsorData.suffix}`;
    return fullName;
  }
  
  return 'Unknown Sponsor';
}

/**
 * Extract legislator ID from sponsor data
 */
export function getLegislatorId(sponsorData: any): string | undefined {
  if (!sponsorData || typeof sponsorData === 'string') {
    return undefined;
  }
  
  // Return the first valid ID found
  return sponsorData.people_id?.toString() || 
         sponsorData.id?.toString() || 
         sponsorData.legislator_id?.toString();
}

/**
 * Format a database record into the standard LegislatorInfo structure
 */
export function formatLegislatorFromDbRecord(record: any): any {
  if (!record || Object.keys(record).length === 0) {
    return null;
  }
  
  // Construct the name object
  const name = {
    first: record.given_name || '',
    middle: '',
    last: record.family_name || '',
    suffix: '',
    full: record.name || `${record.given_name || ''} ${record.family_name || ''}`.trim()
  };
  
  if (!name.full) {
    name.full = 'Unknown Legislator';
  }
  
  // Format contact information as arrays
  const email = record.email ? [record.email] : [];
  const phone = [];
  
  if (record.capitol_voice) {
    phone.push(record.capitol_voice);
  }
  
  if (record.district_voice && record.district_voice !== record.capitol_voice) {
    phone.push(record.district_voice);
  }
  
  // Get role from chamber
  const role = getRoleName(record.current_chamber);
  
  return {
    id: record.id,
    name,
    party: record.current_party || '',
    email,
    phone,
    district: record.current_district ? record.current_district.toString() : '',
    role,
    office: record.capitol_address || '',
    state: 'IL',
    image: record.image || undefined
  };
}

/**
 * Create a basic legislator object with just a name
 */
export function createBasicLegislator(name: string): any {
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Try to extract party if present
  let party = '';
  if (name.includes('(D)')) party = 'D';
  else if (name.includes('(R)')) party = 'R';
  else if (name.includes('(I)')) party = 'I';
  
  // Extract role if present
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
      full: name.replace(/\s*\([^)]*\)/g, '').trim() // Remove party info in parentheses
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
