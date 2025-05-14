
import { fetchLegislator } from './fetchSingle';
import { LegislatorSearchOptions } from '../types';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        resolve(func(...args));
      }, delay);
    });
  };
}

// Create a debounced version of the search function
export const searchLegislatorDebounced = debounce(
  (name: string, options?: LegislatorSearchOptions) => fetchLegislator(undefined, name, options),
  300
);
