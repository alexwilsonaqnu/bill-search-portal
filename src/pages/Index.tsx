
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import BillUploader from "@/components/BillUploader";
import { fetchBills } from "@/services/billService";
import { FALLBACK_BILLS } from "@/data/fallbackBills";
import { toast } from "sonner";
import { Bill } from "@/types";
import HeaderSection from "@/components/HeaderSection";
import DebugInfo from "@/components/DebugInfo";
import BillsList from "@/components/BillsList";
import { useSupabaseStatus } from "@/hooks/useSupabaseStatus";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const [showUploader, setShowUploader] = useState(true);
  const [processedBills, setProcessedBills] = useState<Bill[]>([]);
  
  const { dbStatus, storageStatus, availableBuckets } = useSupabaseStatus();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
  
  const handleBillsProcessed = (bills: Bill[]) => {
    setProcessedBills(bills);
    toast.success(`${bills.length} bills are now available`);
    refetch();
  };
  
  const toggleUploader = () => {
    setShowUploader(!showUploader);
  };

  // Determine if we have bills to show
  const billsToShow = data?.bills && data.bills.length > 0 
    ? data.bills 
    : processedBills.length > 0 
      ? processedBills 
      : null;

  return (
    <div className="min-h-screen bg-gray-50 relative page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
        <HeaderSection 
          query={query} 
          onSearch={handleSearch} 
          showUploader={showUploader} 
          toggleUploader={toggleUploader} 
        />
        
        <DebugInfo 
          query={query}
          currentPage={currentPage}
          dbStatus={dbStatus}
          storageStatus={storageStatus}
          buckets={availableBuckets}
          error={error}
          data={data}
        />
        
        {showUploader && (
          <div className="mb-8">
            <BillUploader onBillsProcessed={handleBillsProcessed} />
          </div>
        )}

        <BillsList 
          isLoading={isLoading}
          billsToShow={billsToShow}
          data={data}
          error={error}
          onRetry={handleRetry}
          onPageChange={handlePageChange}
          fallbackBills={FALLBACK_BILLS}
        />
      </div>
    </div>
  );
};

export default Index;
