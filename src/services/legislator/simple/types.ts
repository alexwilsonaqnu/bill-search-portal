
/**
 * Core legislator data types
 */

export interface LegislatorName {
  first: string;
  middle: string;
  last: string;
  suffix: string;
  full: string;
}

export interface LegislatorInfo {
  id?: string;
  name: LegislatorName;
  party: string;
  role: string;
  district: string;
  state: string;
  email: string[];
  phone: string[];
  office?: string;
  image?: string;
}

export interface LegislatorSearchOptions {
  forceRefresh?: boolean;
}
