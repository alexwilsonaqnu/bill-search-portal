
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { fetchBills } from "@/services/billService";
import HeaderSection from "@/components/HeaderSection";
import BillsList from "@/components/BillsList";
import { useSupabaseStatus } from "@/hooks/useSupabaseStatus";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const [isSearchInitiated, setIsSearchInitiated] = useState(!!query);
  
  const { dbStatus, storageStatus } = useSupabaseStatus();
  
  // Only fetch when there's a search query AND search is initiated
  // This prevents auto-fetch on component mount with existing query param
  const enabled = !!query && isSearchInitiated;
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once to avoid hammering failing API
    meta: {
      onError: (error) => {
        // Enhanced error messaging based on specific error types
        if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
          toast.error("Search request timed out", {
            description: "The LegiScan API is taking too long to respond. Please try again later or try a different search term."
          });
        } else {
          toast.error("Error searching for bills", {
            description: "There was a problem connecting to LegiScan. Please try again later."
          });
        }
      }
    }
  });

  // Clear isSearchInitiated flag when query changes from URL
  useEffect(() => {
    if (!query) {
      setIsSearchInitiated(false);
    }
  }, [query]);

  const handleSearch = useCallback((newQuery: string) => {
    if (!newQuery.trim()) return;
    
    // Set search initiated flag to trigger the query
    setIsSearchInitiated(true);
    
    if (newQuery.trim() === query) {
      // If same query, force refetch
      refetch();
    } else {
      setSearchParams({ q: newQuery, page: "1" });
    }
  }, [query, refetch, setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    setSearchParams({ q: query, page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [query, setSearchParams]);

  const handleRetry = useCallback(() => {
    toast.info("Retrying search...");
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
            <button 
              onClick={() => handleSearch(query)}
              className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors"
            >
              Search for "{query}"
            </button>
          </div>
        )}

        {query && !isSearching && data?.bills && data.bills.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Found {data.totalItems} results for "{query}"
          </div>
        )}

        {query && isSearchInitiated && !isSearching && (!data?.bills || data.bills.length === 0) && (
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
