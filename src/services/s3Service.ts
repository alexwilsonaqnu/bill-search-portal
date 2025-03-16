
import { Bill, SearchResults } from "@/types";
import { filterItems, paginateItems } from "@/utils/paginationUtils";

const BASE_URL = "https://billinois-bill.s3.amazonaws.com"; // Updated S3 bucket URL

/**
 * Fetches bill data from S3
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    // Fetch bills from the S3 bucket
    const response = await fetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch bills from S3");
    }
    
    const allBills: Bill[] = await response.json();
    
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
 * Fetches a specific bill by ID from S3
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    // Fetch bills from the S3 bucket
    const response = await fetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch bill from S3");
    }
    
    const bills: Bill[] = await response.json();
    const bill = bills.find((bill) => bill.id === id);
    
    return bill || null;
  } catch (error) {
    console.error("Error fetching bill:", error);
    return null;
  }
}
