
// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Helper function to create consistent API responses
export function createResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    }
  );
}

// Transform OpenStates API responses into our common format
export function processOpenStatesResponse(data: any): any {
  if (!data) {
    console.log("Cannot process null OpenStates data");
    return null;
  }
  
  try {
    console.log(`Processing OpenStates data for: ${data.name || 'unknown'}`);
    
    // Extract contact information
    const email = data.email ? [data.email] : [];
    
    // Process phone numbers
    const phones: string[] = [];
    if (data.offices && Array.isArray(data.offices)) {
      data.offices.forEach((office: any) => {
        if (office.voice) phones.push(office.voice);
      });
    }
    
    // Extract party information and normalize
    let party = '';
    if (data.party) {
      if (typeof data.party === 'string') {
        party = data.party.substring(0, 1); // Just get first letter (D or R)
      } else if (data.party.length > 0) {
        party = data.party[0].substring(0, 1); // First party's first letter
      }
    }
    
    // Process name components
    const names = {
      full: data.name || '',
      first: data.given_name || '',
      last: data.family_name || '',
      suffix: data.suffix || ''
    };
    
    // Find the first office with an address for office location
    let office = '';
    if (data.offices && Array.isArray(data.offices)) {
      const officeWithAddress = data.offices.find((o: any) => o.address);
      if (officeWithAddress) {
        office = officeWithAddress.address;
      }
    }
    
    // Get district information
    let district = '';
    if (data.current_district) {
      district = data.current_district.toString();
    } else if (data.districts && data.districts.length > 0) {
      district = data.districts[0].district;
    }
    
    // Determine role based on chamber
    let role = 'Legislator';
    if (data.current_chamber === 'upper' || 
        (data.chamber && data.chamber === 'upper')) {
      role = 'Senator';
    } else if (data.current_chamber === 'lower' || 
              (data.chamber && data.chamber === 'lower')) {
      role = 'Representative';
    }
    
    const result = {
      name: names,
      party,
      email,
      phone: phones,
      office,
      district,
      role,
      state: 'IL',
    };
    
    console.log(`Processed OpenStates data successfully for: ${names.full}`);
    return result;
  } catch (error) {
    console.error("Error processing OpenStates response:", error);
    return {
      name: { full: data.name || "Unknown Legislator" },
      role: "Legislator",
      state: "IL",
      party: "",
      email: [],
      phone: [],
      error: error.message
    };
  }
}

// Clean up a name for searching
export function cleanNameForSearch(name: string): string {
  return name
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .toLowerCase();
}
