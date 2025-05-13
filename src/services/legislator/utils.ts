
/**
 * Helper function to extract legislator ID from sponsor data
 */
export function getLegislatorId(sponsorData: any): string | undefined {
  if (!sponsorData) {
    console.log('getLegislatorId: sponsorData is null or undefined');
    return undefined;
  }
  
  if (typeof sponsorData === 'string') {
    console.log('getLegislatorId: sponsorData is a string, cannot extract ID');
    return undefined;
  }
  
  // Log the structure for debugging
  console.log('getLegislatorId: Examining sponsor data', sponsorData);
  
  const id = sponsorData.people_id?.toString() || 
         sponsorData.id?.toString() || 
         sponsorData.legislator_id?.toString();
         
  console.log(`getLegislatorId: Extracted ID: ${id || 'undefined'}`);
  return id;
}

/**
 * Helper function to extract sponsor name from sponsor data
 */
export function getSponsorName(sponsorData: any): string {
  if (typeof sponsorData === 'string') return sponsorData;
  if (!sponsorData) return 'Unknown';
  
  // Log the structure for debugging
  console.log('getSponsorName: Examining sponsor data', sponsorData);
  
  if (sponsorData.message && sponsorData.message.includes("Circular")) {
    const path = sponsorData.message.replace("[Circular Reference to ", "").replace("]", "");
    if (path === "root.sponsor") {
      return "Referenced Sponsor";
    }
    return "Referenced Sponsor";
  }
  
  if (typeof sponsorData.name === 'string') return sponsorData.name;
  if (typeof sponsorData.full_name === 'string') return sponsorData.full_name;
  
  const nameParts = [];
  if (sponsorData.first_name) nameParts.push(sponsorData.first_name);
  if (sponsorData.middle_name) nameParts.push(sponsorData.middle_name);
  if (sponsorData.last_name) nameParts.push(sponsorData.last_name);
  
  if (nameParts.length > 0) {
    const fullName = nameParts.join(' ');
    if (sponsorData.suffix) return `${fullName}, ${sponsorData.suffix}`;
    return fullName;
  }
  
  let displayName = 'Unknown';
  if (sponsorData.role) {
    displayName = `${sponsorData.role}.`;
    if (sponsorData.party) displayName += ` (${sponsorData.party})`;
  } else if (sponsorData.title) {
    displayName = sponsorData.title;
  }
  
  console.log(`getSponsorName: Extracted name: ${displayName}`);
  return displayName;
}
