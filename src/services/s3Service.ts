
import { Bill, SearchResults } from "@/types";

const BASE_URL = "https://your-s3-bucket-url.s3.amazonaws.com"; // Replace with your actual S3 bucket URL

/**
 * Fetches bill data from S3
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    // In a real implementation, you would:
    // 1. Make a request to your S3 bucket or API gateway
    // 2. Filter and paginate results on the server or in this function

    // For now, we'll simulate an API call to S3
    const response = await fetch(`${BASE_URL}/bills.json`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch bills from S3");
    }
    
    const allBills: Bill[] = await response.json();
    
    // Filter bills if a search query is provided
    const filteredBills = query
      ? allBills.filter(
          (bill) =>
            bill.title.toLowerCase().includes(query.toLowerCase()) ||
            bill.description.toLowerCase().includes(query.toLowerCase())
        )
      : allBills;

    // Paginate results
    const totalPages = Math.ceil(filteredBills.length / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedBills = filteredBills.slice(start, end);

    return {
      bills: paginatedBills,
      totalPages,
      currentPage: page,
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
    // In a real implementation, you might have individual files for each bill
    // or a more efficient lookup mechanism
    
    // For now, we'll fetch all bills and find the matching one
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
