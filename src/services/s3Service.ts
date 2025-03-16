
import { Bill, SearchResults } from "@/types";
import { filterItems, paginateItems } from "@/utils/paginationUtils";

const BASE_URL = "https://billinois-bill.s3.amazonaws.com"; // S3 bucket URL
const PROXY_BASE_URL = "https://cors-anywhere.herokuapp.com/"; // CORS proxy service

/**
 * Fetches bill data from S3
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    // First try direct fetch
    try {
      const response = await fetch(`${BASE_URL}/bills.json`);
      if (response.ok) {
        const allBills: Bill[] = await response.json();
        return processResults(allBills, query, page, pageSize);
      }
    } catch (directError) {
      console.log("Direct fetch failed, trying proxy...");
    }

    // If direct fetch fails, try using a CORS proxy
    const proxyResponse = await fetch(`${PROXY_BASE_URL}${BASE_URL}/bills.json`, {
      headers: {
        'Origin': window.location.origin,
      }
    });
    
    if (!proxyResponse.ok) {
      throw new Error("Failed to fetch bills from S3");
    }
    
    const allBills: Bill[] = await proxyResponse.json();
    return processResults(allBills, query, page, pageSize);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return {
      bills: [],
      totalPages: 0,
      currentPage: page,
    };
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
 * Fetches a specific bill by ID from S3
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    // First try direct fetch
    try {
      const response = await fetch(`${BASE_URL}/bills.json`);
      if (response.ok) {
        const bills: Bill[] = await response.json();
        return bills.find((bill) => bill.id === id) || null;
      }
    } catch (directError) {
      console.log("Direct fetch failed, trying proxy...");
    }

    // If direct fetch fails, try using a CORS proxy
    const proxyResponse = await fetch(`${PROXY_BASE_URL}${BASE_URL}/bills.json`, {
      headers: {
        'Origin': window.location.origin,
      }
    });
    
    if (!proxyResponse.ok) {
      throw new Error("Failed to fetch bill from S3");
    }
    
    const bills: Bill[] = await proxyResponse.json();
    const bill = bills.find((bill) => bill.id === id);
    
    return bill || null;
  } catch (error) {
    console.error("Error fetching bill:", error);
    return null;
  }
}
