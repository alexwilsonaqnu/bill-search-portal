
/**
 * Paginates an array of items
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  paginatedItems: T[];
  totalPages: number;
  currentPage: number;
} {
  // Calculate total pages - minimum 1 page even for empty arrays
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  
  // Ensure current page is within valid range
  const safeCurrentPage = Math.min(Math.max(1, page), totalPages);
  
  const start = (safeCurrentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = items.slice(start, end);

  return {
    paginatedItems,
    totalPages,
    currentPage: safeCurrentPage,
  };
}

/**
 * Filters an array based on a search query across specified fields
 */
export function filterItems<T>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerQuery);
      }
      return false;
    });
  });
}
