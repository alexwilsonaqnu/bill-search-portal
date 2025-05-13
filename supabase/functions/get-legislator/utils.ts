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
  let district = "";

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
  
  // Get district information
  if (legislator.current_role?.district) {
    district = legislator.current_role.district;
  } else if (legislator.district) {
    district = legislator.district;
  } else if (legislator.roles && legislator.roles.length > 0) {
    district = legislator.roles[0].district || '';
  } else if (typeof legislator.district_name === 'string') {
    district = legislator.district_name;
  }
  
  // Fallback for office location
  if (!officeLocation && legislator.chamber) {
    officeLocation = legislator.chamber === 'upper' ? 'Senate' : 'House';
  }

  // Build the name object
  const nameParts = {
    first: legislator.name?.split(' ')[0] || legislator.first_name || '',
    middle: legislator.middle_name || '',
    last: legislator.name?.split(' ').slice(1).join(' ') || legislator.last_name || '',
    suffix: legislator.suffix || '',
    full: legislator.name || `${legislator.first_name || ''} ${legislator.middle_name || ''} ${legislator.last_name || ''}`.trim()
  };
  
  // Determine party
  let party = legislator.party || '';
  if (party === 'D') party = 'Democratic';
  else if (party === 'R') party = 'Republican';
  else if (party === 'I') party = 'Independent';

  return {
    party,
    email: emails,
    phone: phones,
    district,
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
    .replace(/\s*\([^)]*\)/g, '') // Remove anything in parentheses like (D) or (R)
    .trim();
}

// Create a response with CORS headers and HTTP cache headers
export function createResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data), 
    { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        // Add HTTP cache headers to enable downstream caching
        "Cache-Control": "max-age=3600, stale-while-revalidate=86400", // 1 hour cache, 24 hour stale
        "Surrogate-Control": "max-age=86400" // CDN cache for 24 hours
      },
      status 
    }
  );
}
