
// Create a fallback legislator object when we can't fetch by ID
export function createFallbackLegislator(legislatorId: string) {
  return {
    name: {
      first: "",
      middle: "",
      last: "",
      suffix: "",
      full: `Legislator ${legislatorId}`
    },
    party: "",
    email: [],
    phone: [],
    district: "",
    role: "Legislator",
    office: "",
    state: "Illinois" // Default to Illinois since we're in the Billinois app
  };
}

// Enhanced function to create a more detailed legislator object from just the name when API fails
export function createEnhancedLegislatorFromName(name: string) {
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Try to extract party information if present in parentheses
  let party = '';
  if (name.includes('(D)')) party = 'Democratic';
  else if (name.includes('(R)')) party = 'Republican';
  else if (name.includes('(I)')) party = 'Independent';
  
  // Extract state from name if possible (sometimes in format "Name (X-State)")
  let state = 'Illinois'; // Default to Illinois for Billinois app
  const stateMatch = name.match(/\(([^)]+)\)/);
  if (stateMatch && stateMatch[1]) {
    const matchParts = stateMatch[1].split('-');
    if (matchParts.length > 1) {
      state = matchParts[1];
    }
  }
  
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
    state
  };
}
