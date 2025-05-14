
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
 * Get a human-readable role name from chamber value
 */
export function getRoleName(chamber?: string): string {
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
