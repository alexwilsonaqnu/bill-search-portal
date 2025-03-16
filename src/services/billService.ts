import { Bill, SearchResults } from "@/types";
import { filterItems, paginateItems } from "@/utils/paginationUtils";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

// Supabase client setup
// Note: These environment variables need to be set for your project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fallback data for development/demo (keeping the same demo data)
const FALLBACK_BILLS: Bill[] = [
  {
    id: "IL-HB1234",
    title: "Education Funding Reform",
    description: "A bill to reform education funding in Illinois",
    status: "In Committee",
    lastUpdated: "2025-03-01",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2025-01-15",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This bill aims to reform the education funding system in Illinois."
          },
          {
            id: "s2",
            title: "Funding Formula",
            content: "The new funding formula will be based on student needs and district resources."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the bill"
      }
    ]
  },
  {
    id: "IL-SB5678",
    title: "Infrastructure Investment Act",
    description: "A comprehensive plan to improve Illinois infrastructure",
    status: "Passed Senate",
    lastUpdated: "2025-02-28",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2025-01-10",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This bill establishes a framework for infrastructure investment in Illinois."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the bill"
      },
      {
        id: "c2",
        description: "Amendment to include rural areas"
      }
    ]
  },
  {
    id: "IL-HB9012",
    title: "Healthcare Accessibility Act",
    description: "Expanding healthcare access to underserved communities",
    status: "In House",
    lastUpdated: "2025-03-10",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2025-02-01",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This bill aims to expand healthcare access across Illinois."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the bill"
      }
    ]
  }
];

/**
 * Fetches bill data from Supabase, falling back to demo data if necessary
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    console.log("Fetching bills from Supabase...");
    
    const { data, error } = await supabase
      .from('bills')
      .select('*');
    
    if (error) {
      console.warn(`Supabase fetch failed: ${error.message}`);
      toast.info("Using demo data - Supabase data not available");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    if (!data || data.length === 0) {
      console.log("No bills found in Supabase, using fallback data");
      toast.info("Using demo data - No bills found in Supabase");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    console.log(`Successfully fetched ${data.length} bills from Supabase`);
    return processResults(data, query, page, pageSize);
  } catch (error) {
    console.error("Error fetching bills:", error);
    toast.info("Using demo data - Connection to Supabase failed");
    return processResults(FALLBACK_BILLS, query, page, pageSize);
  }
}

/**
 * Processes fetch results with filtering and pagination
 */
function processResults(
  allBills: Bill[],
  query: string,
  page: number,
  pageSize: number
): SearchResults {
  // Filter bills based on search query
  const filteredBills = query
    ? filterItems(allBills, query, ["title", "description", "id"])
    : allBills;

  // Paginate the filtered results
  const { paginatedItems, totalPages, currentPage } = paginateItems(
    filteredBills,
    page,
    pageSize
  );

  return {
    bills: paginatedItems,
    totalPages,
    currentPage,
  };
}

/**
 * Fetches a specific bill by ID from Supabase, falling back to demo data if necessary
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    console.log(`Fetching bill ${id} from Supabase...`);
    
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.warn(`Supabase fetch failed: ${error.message}`);
      const bill = FALLBACK_BILLS.find(bill => bill.id === id);
      if (!bill) {
        toast.info(`Bill ${id} not found in demo data`);
        return null;
      }
      toast.info("Using demo data - Supabase data not available");
      return bill;
    }
    
    if (!data) {
      console.warn(`Bill ${id} not found in Supabase`);
      // Check fallback data as a last resort
      const fallbackBill = FALLBACK_BILLS.find(b => b.id === id);
      if (fallbackBill) {
        toast.info("Using demo data - Bill not found in Supabase");
        return fallbackBill;
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    
    const bill = FALLBACK_BILLS.find(bill => bill.id === id);
    if (!bill) return null;
    
    toast.info("Using demo data - Connection to Supabase failed");
    return bill;
  }
}
