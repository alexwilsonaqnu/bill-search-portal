
/**
 * Create a debounce function for API calls
 */
export function debounce<F extends (...args: any[]) => Promise<any>>(
  func: F,
  waitFor: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        resolve(await func(...args));
      }, waitFor);
    });
  };

  return debounced;
}
