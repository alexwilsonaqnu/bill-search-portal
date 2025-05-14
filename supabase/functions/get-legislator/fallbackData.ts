
// Create basic legislator information from a name
export function createEnhancedLegislatorFromName(name: string) {
  // Parse name more intelligently
  const nameParts = parseName(name);
  const party = detectPartyFromName(name);
  
  console.log(`Creating enhanced fallback legislator for "${name}" with party "${party}"`);
  
  return {
    name: nameParts,
    role: detectRoleFromName(name) || "Legislator",
    party: party,
    state: "IL",
    fallback: true,
    email: [],
    phone: [],
  };
}

// Create a fallback legislator object with minimal information
export function createFallbackLegislator(legislatorId: string) {
  console.log(`Creating basic fallback legislator for ID: ${legislatorId}`);
  return {
    name: { full: `Legislator ${legislatorId}`, first: "", last: "" },
    role: "Legislator",
    state: "IL",
    party: "",
    fallback: true,
    email: [],
    phone: [],
  };
}

// Helper function to parse name into components
function parseName(fullName: string) {
  fullName = fullName.replace(/\([^)]*\)/g, '').trim(); // Remove anything in parentheses
  
  const parts = fullName.split(' ').filter(p => p.length > 0);
  if (parts.length === 0) return { full: fullName, first: "", last: "" };
  
  if (parts.length === 1) return { full: parts[0], first: parts[0], last: "" };
  
  return {
    full: fullName,
    first: parts[0],
    last: parts[parts.length - 1],
    middle: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
  };
}

// Try to detect party from name string (sometimes included in parentheses)
function detectPartyFromName(name: string): string {
  const partyMatch = name.match(/\(([DR])\)/i);
  if (partyMatch) {
    const party = partyMatch[1].toUpperCase();
    return party === 'D' ? 'D' : party === 'R' ? 'R' : '';
  }
  
  // Check for Democrat/Republican words
  if (/\bDem(ocrat)?\b/i.test(name)) return 'D';
  if (/\bRep(ublican)?\b/i.test(name)) return 'R';
  
  return '';
}

// Try to detect role from name string
function detectRoleFromName(name: string): string {
  if (/\bSenator\b/i.test(name)) return 'Senator';
  if (/\bRep(resentative)?\b/i.test(name)) return 'Representative';
  return '';
}
