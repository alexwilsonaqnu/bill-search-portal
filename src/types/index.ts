export interface Bill {
  id: string;
  title: string;
  description?: string;
  status?: string;
  lastUpdated?: string;
  sessionName?: string;
  sessionYear?: string;
  versions: BillVersion[];
  changes: BillChange[];
  data?: any;
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

export interface BillChange {
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
