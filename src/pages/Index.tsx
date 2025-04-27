
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
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const { dbStatus, storageStatus, availableBuckets } = useSupabaseStatus();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bills", query, currentPage, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchBills(query, currentPage, undefined, undefined, startDate, endDate),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    enabled: !!query,
  });

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, page: "1" });
  };

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
    if (query) {
      refetch();
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

  return (
    <div className="min-h-screen bg-gray-50 relative page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
        <HeaderSection 
          query={query} 
          onSearch={handleSearch}
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
        
        {!query && !isLoading && (
          <div className="text-center text-gray-500 mt-8">
            Enter a search term to find bills
          </div>
        )}

        {query && !isLoading && data?.bills && data.bills.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Found {data.totalItems} results for "{query}"
          </div>
        )}

        {query && !isLoading && (!data?.bills || data.bills.length === 0) && (
          <div className="text-center text-gray-500 mt-8">
            No bills found for "{query}"
          </div>
        )}

        <BillsList 
          isLoading={isLoading}
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
