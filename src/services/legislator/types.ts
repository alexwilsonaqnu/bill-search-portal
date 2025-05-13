
// Define the legislator info interface
export interface LegislatorName {
  first: string;
  middle: string;
  last: string;
  suffix: string;
  full: string;
}

export interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
  district: string;
  role: string;
  name: LegislatorName;
  office?: string;
  state?: string;
}
