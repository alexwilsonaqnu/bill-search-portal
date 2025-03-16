
import { Bill, SearchResults } from "@/types";
import { filterItems, paginateItems } from "@/utils/paginationUtils";
import { toast } from "sonner";

// Updated S3 bucket URL to match the one in Python script
const BASE_URL = "https://billinois-bills.s3.amazonaws.com"; // S3 bucket URL

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
 * Helper function to safely fetch from an URL with timeout and better error handling
 */
async function safeFetch(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(`Request to ${url} timed out after ${timeoutMs}ms`);
  }, timeoutMs);
  
  try {
    console.log(`Attempting fetch from: ${url}`);
    const response = await fetch(url, { 
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Fetch failed with status: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Fetch error for ${url}:`, error);
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
    console.log("Fetching bills from S3...");
    // Try to fetch bills.json from the updated bucket URL
    const response = await safeFetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      console.warn(`S3 fetch failed with status: ${response.status} - ${response.statusText}`);
      toast.info("Using demo data - S3 data not available");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    try {
      const allBills: Bill[] = await response.json();
      console.log(`Successfully fetched ${allBills.length} bills from S3`);
      return processResults(allBills, query, page, pageSize);
    } catch (parseError) {
      console.error("Error parsing JSON from S3:", parseError);
      toast.info("Using demo data - Invalid data format from S3");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
  } catch (error) {
    console.error("Error fetching bills:", error);
    
    // Provide more specific error messaging based on error type
    if (error instanceof DOMException && error.name === 'AbortError') {
      toast.info("Using demo data - S3 request timed out");
    } else if (error instanceof TypeError && (error.message.includes("Failed to fetch") || error.message.includes("Network") || error.message.includes("CORS"))) {
      toast.info("Using demo data - Network or CORS issue");
    } else {
      toast.info("Using demo data - Connection to S3 failed");
    }
    
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
    console.log(`Fetching bill ${id} from S3...`);
    const response = await safeFetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      console.warn(`S3 fetch failed with status: ${response.status} - ${response.statusText}`);
      const bill = FALLBACK_BILLS.find(bill => bill.id === id);
      if (!bill) {
        toast.info(`Bill ${id} not found in demo data`);
        return null;
      }
      toast.info("Using demo data - S3 data not available");
      return bill;
    }
    
    try {
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
    } catch (parseError) {
      console.error("Error parsing JSON from S3:", parseError);
      const bill = FALLBACK_BILLS.find(bill => bill.id === id);
      if (bill) {
        toast.info("Using demo data - Invalid data format from S3");
        return bill;
      }
      return null;
    }
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    
    // Provide more specific error messaging based on error type
    const bill = FALLBACK_BILLS.find(bill => bill.id === id);
    if (!bill) return null;
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      toast.info("Using demo data - S3 request timed out");
    } else if (error instanceof TypeError && (error.message.includes("Failed to fetch") || error.message.includes("Network") || error.message.includes("CORS"))) {
      toast.info("Using demo data - Network or CORS issue");
    } else {
      toast.info("Using demo data - Connection to S3 failed");
    }
    
    return bill;
  }
}
