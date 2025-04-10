
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
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log detailed information about available data for debugging
  console.log("Index page - Data status:", {
    isLoading,
    hasError: !!error,
    billsCount: data?.bills?.length || 0,
    totalBills: data?.totalItems || 0,
    dbStatus,
    storageStatus,
    availableBuckets,
  });

  if (error) {
    console.error("Error fetching bills:", error);
  }

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ q: query, page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    toast.info("Retrying bill fetch...");
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 relative page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
        <HeaderSection 
          query={query} 
          onSearch={handleSearch} 
        />
        
        {!isLoading && data?.bills && data.bills.length > 0 && (
          <div className="mb-4 text-sm text-gray-500 italic">
            Bills are sorted by most recent updates first
          </div>
        )}

        <BillsList 
          isLoading={isLoading}
          billsToShow={data?.bills}
          data={data}
          error={error}
          onRetry={handleRetry}
          onPageChange={handlePageChange}
          fallbackBills={[]}
        />
      </div>
    </div>
  );
};

export default Index;
