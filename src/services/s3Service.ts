
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
 * Fetches bill data from S3, falling back to demo data if necessary
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    // Attempt to fetch from S3
    const response = await fetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      // If fetch fails, use fallback data but notify the user
      console.warn("S3 fetch failed, using fallback data");
      toast.info("Using demo data - S3 bucket not accessible");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    const allBills: Bill[] = await response.json();
    return processResults(allBills, query, page, pageSize);
  } catch (error) {
    console.error("Error fetching bills:", error);
    // Use fallback data in case of any error
    toast.info("Using demo data - S3 bucket not accessible");
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
    ? filterItems(allBills, query, ["title", "description"])
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
    const response = await fetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      // If fetch fails, use fallback data but notify the user
      console.warn("S3 fetch failed, using fallback data");
      const bill = FALLBACK_BILLS.find(bill => bill.id === id);
      return bill || null;
    }
    
    const bills: Bill[] = await response.json();
    const bill = bills.find(bill => bill.id === id);
    
    return bill || null;
  } catch (error) {
    console.error("Error fetching bill:", error);
    // Use fallback data in case of any error
    const bill = FALLBACK_BILLS.find(bill => bill.id === id);
    return bill || null;
  }
}
