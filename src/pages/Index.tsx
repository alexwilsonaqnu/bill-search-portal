
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { fetchBills } from "@/services/billService";
import { toast } from "sonner";
import HeaderSection from "@/components/HeaderSection";
import BillsList from "@/components/BillsList";
import { useSupabaseStatus } from "@/hooks/useSupabaseStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, HardDrive } from "lucide-react";

// Define the constant for the bill storage bucket
const BILL_STORAGE_BUCKET = "bills";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  
  const { dbStatus, storageStatus, availableBuckets, isInitializing } = useSupabaseStatus();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isInitializing // Only fetch bills after connection check is complete
  });

  // Log detailed information about available data for debugging
  useEffect(() => {
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
  }, [data, error, isLoading, dbStatus, storageStatus, availableBuckets]);

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

  // Determine if we should show the status alert
  const showStatusAlert = (!data || data.bills.length === 0) && !isLoading && availableBuckets.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 relative page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
        <HeaderSection 
          query={query} 
          onSearch={handleSearch} 
        />
        
        {showStatusAlert && (
          <Alert className="mb-6 border-amber-500">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle>No Bills Found</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Connected to Supabase but no bills were found in the database or storage buckets.
              </p>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  <span>Database: {dbStatus.split(',')[1] || "No data"}</span>
                </div>
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-1" />
                  <span>Storage: {availableBuckets.includes(BILL_STORAGE_BUCKET) ? `Bucket "${BILL_STORAGE_BUCKET}" found` : `Bucket "${BILL_STORAGE_BUCKET}" missing`}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
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
