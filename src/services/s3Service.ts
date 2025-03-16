
import { Bill, SearchResults } from "@/types";
import { filterItems, paginateItems } from "@/utils/paginationUtils";
import { toast } from "sonner";

const BASE_URL = "https://billinois-bill.s3.amazonaws.com"; // S3 bucket URL

// Fallback data for development/demo
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
 * Helper function to safely fetch from an URL with timeout
 */
async function safeFetch(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetches bill data from S3, falling back to demo data if necessary
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    // Attempt to fetch from S3 with a timeout
    console.log("Fetching bills from S3...");
    const response = await safeFetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      console.warn(`S3 fetch failed with status: ${response.status}`);
      toast.info("Using demo data - S3 data not available");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    const allBills: Bill[] = await response.json();
    console.log(`Successfully fetched ${allBills.length} bills from S3`);
    return processResults(allBills, query, page, pageSize);
  } catch (error) {
    console.error("Error fetching bills:", error);
    // Use fallback data in case of any error
    toast.info("Using demo data - Connection to S3 failed");
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
 * Fetches a specific bill by ID from S3, falling back to demo data if necessary
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    // Attempt to fetch from S3
    console.log(`Fetching bill ${id} from S3...`);
    const response = await safeFetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      console.warn(`S3 fetch failed with status: ${response.status}`);
      const bill = FALLBACK_BILLS.find(bill => bill.id === id);
      if (!bill) {
        toast.info(`Bill ${id} not found in demo data`);
        return null;
      }
      toast.info("Using demo data - S3 data not available");
      return bill;
    }
    
    const bills: Bill[] = await response.json();
    const bill = bills.find(bill => bill.id === id);
    
    if (!bill) {
      console.warn(`Bill ${id} not found in S3 data`);
      // Check fallback data as a last resort
      const fallbackBill = FALLBACK_BILLS.find(b => b.id === id);
      if (fallbackBill) {
        toast.info("Using demo data - Bill not found in S3");
        return fallbackBill;
      }
      return null;
    }
    
    return bill;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    // Use fallback data in case of any error
    const bill = FALLBACK_BILLS.find(bill => bill.id === id);
    if (bill) {
      toast.info("Using demo data - Connection to S3 failed");
      return bill;
    }
    return null;
  }
}
