
export interface Bill {
  id: string;
  title: string;
  description: string;
  lastUpdated?: string;
  status?: string;
  versions: BillVersion[];
  changes: Change[];
  data?: Record<string, any>; // Additional data from JSON
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
};
