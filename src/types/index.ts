
export interface Bill {
  id: string;
  title: string;
  description?: string;
  status?: string;
  lastUpdated?: string;
  sessionName?: string;
  sessionYear?: string;
  text?: string;
  versions: BillVersion[];
  changes: Change[];
  data?: any;
  sponsor?: any; // Add sponsor property
  cosponsors?: any[]; // Add cosponsors property
  state?: string; // Add state property to support state information
}

export interface BillVersion {
  id: string;
  name: string;
  status: string;
  date?: string;
  sections: BillSection[];
}

export interface BillSection {
  id: string;
  title: string;
  content: string;
}

export interface Change {
  id: string;
  description: string;
  details?: string;
}

export type SearchResults = {
  bills: Bill[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
};
