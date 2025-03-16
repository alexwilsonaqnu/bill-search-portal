
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
    totalItems: filteredBills.length // Add the missing totalItems property
  };
}
