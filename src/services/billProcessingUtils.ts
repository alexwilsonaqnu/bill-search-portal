
import { Bill, SearchResults } from "@/types";
import { filterItems, paginateItems } from "@/utils/paginationUtils";

/**
 * Processes fetch results with filtering and pagination
 */
export function processResults(
  allBills: Bill[],
  query: string,
  page: number,
  pageSize: number
): SearchResults {
  // Check if we have any bills to process
  if (!allBills || allBills.length === 0) {
    console.log("No bills to process in processResults");
    return {
      bills: [],
      totalPages: 0,
      currentPage: page,
      totalItems: 0
    };
  }

  console.log(`Processing ${allBills.length} bills with query: "${query}"`);

  // Filter bills based on search query
  const filteredBills = query
    ? filterItems(allBills, query, ["title", "description", "id"])
    : allBills;

  console.log(`After filtering, ${filteredBills.length} bills match the query`);

  // Sort bills by lastUpdated date (most recent first)
  const sortedBills = [...filteredBills].sort((a, b) => {
    // If lastUpdated is not available, fall back to checking data.status_date
    const dateA = a.lastUpdated || (a.data?.status_date ? new Date(a.data.status_date).toISOString() : "");
    const dateB = b.lastUpdated || (b.data?.status_date ? new Date(b.data.status_date).toISOString() : "");
    
    // Sort in descending order (newest first)
    return dateB.localeCompare(dateA);
  });

  // Paginate the sorted results
  const { paginatedItems, totalPages, currentPage } = paginateItems(
    sortedBills,
    page,
    pageSize
  );

  console.log(`Pagination results: page ${currentPage} of ${totalPages}, showing ${paginatedItems.length} bills`);

  return {
    bills: paginatedItems,
    totalPages,
    currentPage,
    totalItems: filteredBills.length
  };
}
