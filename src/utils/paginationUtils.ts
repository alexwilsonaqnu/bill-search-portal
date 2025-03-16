
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
  const totalPages = Math.ceil(items.length / pageSize);
  const safeCurrentPage = Math.min(Math.max(1, page), totalPages || 1);
  
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
