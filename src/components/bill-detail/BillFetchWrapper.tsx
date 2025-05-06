
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useBillData } from "@/hooks/useBillData";
import Navbar from "@/components/Navbar";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { toast } from "@/components/ui/use-toast";
import { fetchBillText } from "@/services/legiscan";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [isApiDown, setIsApiDown] = useState(false);
  const [billText, setBillText] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  
  // Handle the case where ID is not provided
  useEffect(() => {
    if (!id) {
      navigate("/");
      toast({
        title: "Error",
        description: "Missing bill ID",
        variant: "destructive"
      });
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

  // Fetch bill text when bill data is loaded
  useEffect(() => {
    const loadBillText = async () => {
      if (bill && id && !billText && !isLoadingText) {
        try {
          setIsLoadingText(true);
          console.log(`Fetching bill text for bill ID: ${id}`);
          
          const textResult = await fetchBillText(id);
          
          if (textResult) {
            console.log("Successfully loaded bill text");
            setBillText(textResult.text || null);
            
            // Update the bill object with the text content
            if (textResult.text) {
              bill.text = textResult.text;
            }
          }
        } catch (error) {
          console.error("Error loading bill text:", error);
          // Don't show a toast here as it could be annoying
          // The component will handle displaying fallback content
        } finally {
          setIsLoadingText(false);
        }
      }
    };
    
    loadBillText();
  }, [bill, id, billText, isLoadingText]);
  
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
    setBillText(null);
    toast({
      title: "Retrying",
      description: "Attempting to reload bill data..."
    });
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
