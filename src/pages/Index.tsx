
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { fetchBills } from "@/services/billService";
import { toast } from "sonner";
import HeaderSection from "@/components/HeaderSection";
import BillsList from "@/components/BillsList";
import { useSupabaseStatus } from "@/hooks/useSupabaseStatus";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  
  const { dbStatus, storageStatus, availableBuckets } = useSupabaseStatus();
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    enabled: !!query, // Only fetch when there's a search query
    retry: 2,
    retryDelay: (attempt) => Math.min(attempt * 1000, 3000), // Exponential backoff with max 3s
  });

  console.log("Index page - Search status:", {
    query,
    isLoading,
    isFetching,
    hasError: !!error,
    resultsCount: data?.bills?.length || 0,
    totalResults: data?.totalItems || 0,
  });

  const handleSearch = (newQuery: string) => {
    if (newQuery.trim() === query) {
      // If same query, force refetch
      refetch();
    } else {
      setSearchParams({ q: newQuery, page: "1" });
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ q: query, page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    toast.info("Retrying search...");
    refetch();
  };

  const isSearching = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-gray-50 relative page-transition-wrapper">
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

        {query && isSearching && (
          <div className="text-center text-gray-500 mt-8">
            Searching for bills with "{query}"...
          </div>
        )}

        {query && !isSearching && data?.bills && data.bills.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Found {data.totalItems} results for "{query}"
          </div>
        )}

        {query && !isSearching && (!data?.bills || data.bills.length === 0) && (
          <div className="text-center text-gray-500 mt-8">
            No bills found for "{query}"
          </div>
        )}

        {error && !isSearching && (
          <div className="text-center text-red-500 mt-8">
            Error searching for bills. Please try again.
            <button 
              onClick={handleRetry}
              className="block mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Search
            </button>
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
