
// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Process and format OpenStates API response
export function processOpenStatesResponse(legislator: any) {
  if (!legislator) return null;

  // Extract emails and phones from all offices
  const emails: string[] = [];
  const phones: string[] = [];
  let officeLocation = "";

  // Try to extract contact info from offices
  if (Array.isArray(legislator.offices)) {
    for (const office of legislator.offices) {
      if (office.email && !emails.includes(office.email)) {
        emails.push(office.email);
      }
      if (office.phone && !phones.includes(office.phone)) {
        phones.push(office.phone);
      }
      if (office.name && !officeLocation) {
        officeLocation = office.name;
      }
    }
  }
  
  // Fallback for older OpenStates API format
  if (emails.length === 0 && legislator.email) {
    if (Array.isArray(legislator.email)) {
      emails.push(...legislator.email);
    } else if (typeof legislator.email === 'string') {
      emails.push(legislator.email);
    }
  }
  
  if (phones.length === 0 && legislator.phone) {
    if (Array.isArray(legislator.phone)) {
      phones.push(...legislator.phone);
    } else if (typeof legislator.phone === 'string') {
      phones.push(legislator.phone);
    }
  }
  
  // Fallback for office location
  if (!officeLocation && legislator.chamber) {
    officeLocation = legislator.chamber === 'upper' ? 'Senate' : 'House';
  }

  // Build the name object
  const nameParts = {
    first: legislator.name?.split(' ')[0] || '',
    middle: '',
    last: legislator.name?.split(' ').slice(1).join(' ') || '',
    suffix: '',
    full: legislator.name || ''
  };

  return {
    party: legislator.party || '',
    email: emails,
    phone: phones,
    district: legislator.current_role?.district || legislator.district || '',
    role: legislator.current_role?.title || legislator.role || '',
    name: nameParts,
    office: officeLocation,
    state: legislator.current_role?.state || legislator.state || ''
  };
}

// Clean up a name for search by removing titles and suffixes
export function cleanNameForSearch(name: string): string {
  return name
    .replace(/^(Rep\.|Sen\.|Hon\.|Dr\.|Mr\.|Mrs\.|Ms\.|)\s+/i, '')
    .replace(/,?\s+(Jr\.|Sr\.|I|II|III|IV|MD|PhD|Esq\.?)$/i, '')
    .trim();
}

// Create a response with CORS headers
export function createResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data), 
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status 
    }
  );
}
