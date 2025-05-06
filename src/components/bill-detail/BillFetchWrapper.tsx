
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useBillData } from "@/hooks/useBillData";
import Navbar from "@/components/Navbar";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { toast } from "sonner";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [isApiDown, setIsApiDown] = useState(false);
  
  // Handle the case where ID is not provided
  useEffect(() => {
    if (!id) {
      navigate("/");
      toast.error("Missing bill ID");
    }
  }, [id, navigate]);
  
  // Get bill data using our custom hook
  const {
    bill,
    isLoading,
    isError,
    error
  } = useBillData({
    id,
    retryCount // Pass retry count to force refetch on retry
  });
  
  // Detect API down condition
  useEffect(() => {
    if (error) {
      const errorMsg = error.message || "";
      
      // Check for common error patterns that indicate API issues
      if (errorMsg.includes("timeout") || 
          errorMsg.includes("timed out") ||
          errorMsg.includes("Edge Function returned") || 
          errorMsg.includes("network") ||
          errorMsg.includes("API") ||
          errorMsg.includes("unavailable")) {
        setIsApiDown(true);
      }
    } else {
      setIsApiDown(false);
    }
  }, [error]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsApiDown(false);
    toast.info("Retrying...");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Render the appropriate component based on loading/error state
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 container max-w-6xl mx-auto pt-28 pb-16 px-4 md:px-6">
        {isLoading && <BillDetailLoading />}
        
        {isError && (
          <BillDetailError 
            error={error} 
            onRetry={handleRetry} 
            onGoBack={handleGoBack} 
            isApiDown={isApiDown}
          />
        )}
        
        {!isLoading && !isError && bill && (
          <BillDetailView bill={bill} />
        )}
        
        {!isLoading && !isError && !bill && (
          <BillDetailError 
            error={new Error("Bill not found")} 
            onRetry={handleRetry} 
            onGoBack={handleGoBack} 
            isApiDown={false}
          />
        )}
      </div>
    </div>
  );
};

export default BillFetchWrapper;
