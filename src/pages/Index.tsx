
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { fetchBills, clearCache } from "@/services/billService";
import HeaderSection from "@/components/HeaderSection";
import BillsList from "@/components/BillsList";
import { useSupabaseStatus } from "@/hooks/useSupabaseStatus";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const [isSearchInitiated, setIsSearchInitiated] = useState(!!query);
  const [isApiDown, setIsApiDown] = useState(false);
  
  const { dbStatus, storageStatus } = useSupabaseStatus();
  
  // Only fetch when there's a search query AND search is initiated
  // This prevents auto-fetch on component mount with existing query param
  const enabled = !!query && isSearchInitiated;
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Try up to 2 retries (3 total attempts) to avoid hammering failing API
    retryDelay: attempt => Math.min(attempt > 1 ? 3000 : 1000, 8000), // Wait longer between retries
    meta: {
      onSettled: (data, error) => {
        if (error) {
          // Check for API down condition
          // @ts-ignore - Custom property from our enhanced error
          if (error.apiDown) {
            setIsApiDown(true);
            toast.error("Search service is unavailable", {
              description: "We're having trouble connecting to the bill search service. Please try again later."
            });
          } else {
            setIsApiDown(false);
            toast.error("Error searching for bills", {
              description: error.message || "Please try again later"
            });
          }
        } else {
          setIsApiDown(false);
        }
      }
    }
  });

  // Clear isSearchInitiated flag when query changes from URL
  useEffect(() => {
    if (!query) {
      setIsSearchInitiated(false);
      setIsApiDown(false);
    }
  }, [query]);

  const handleSearch = useCallback((newQuery: string) => {
    if (!newQuery.trim()) return;
    
    // Set search initiated flag to trigger the query
    setIsSearchInitiated(true);
    setIsApiDown(false);
    
    if (newQuery.trim() === query) {
      // If same query, force refetch
      refetch();
    } else {
      // Use replace: true to prevent adding to browser history
      setSearchParams({ q: newQuery, page: "1" }, { replace: true });
    }
  }, [query, refetch, setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    // Use replace: true to prevent adding to browser history
    setSearchParams({ q: query, page: page.toString() }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [query, setSearchParams]);

  const handleRetry = useCallback(() => {
    clearCache(); // Clear the cache before retrying
    toast.info("Retrying search...");
    setIsApiDown(false);
    refetch();
  }, [refetch]);

  const isSearching = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
        <HeaderSection 
          query={query} 
          onSearch={handleSearch} 
          isLoading={isSearching}
        />
        
        {!query && !isSearching && (
          <div className="text-center text-gray-500 mt-8">
            Enter a search term to find bills
          </div>
        )}

        {query && !isSearchInitiated && (
          <div className="text-center mt-8">
            <Button 
              onClick={() => handleSearch(query)}
              className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors"
            >
              Search for "{query}"
            </Button>
          </div>
        )}

        {isApiDown && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="text-amber-800 text-sm mb-3">
              <p className="font-medium mb-1">The search service appears to be unavailable</p>
              <p>We're having trouble connecting to the bill search service. This may be a temporary issue.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry} className="border-amber-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        )}

        {query && !isSearching && data?.bills && data.bills.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Found {data.totalItems} results for "{query}"
          </div>
        )}

        {query && isSearchInitiated && !isSearching && (!data?.bills || data.bills.length === 0) && !isApiDown && (
          <div className="text-center text-gray-500 mt-8">
            No bills found for "{query}"
          </div>
        )}

        <BillsList 
          isLoading={isSearching}
          billsToShow={data?.bills}
          data={data}
          error={error}
          onRetry={handleRetry}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Index;
