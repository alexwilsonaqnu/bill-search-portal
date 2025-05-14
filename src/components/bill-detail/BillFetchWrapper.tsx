
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
  const [hasShownApiWarning, setHasShownApiWarning] = useState(false);
  
  // Handle the case where ID is not provided
  useEffect(() => {
    if (!id) {
      navigate("/");
      toast.error("Bill ID is required to view details");
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

  // Extract bill state and number (if available)
  const billState = bill?.state || 'IL';
  const billNumber = bill?.data?.bill_number || bill?.data?.bill?.bill_number;

  // Log bill identifiers
  useEffect(() => {
    if (bill) {
      console.log(`BillFetchWrapper: Loaded bill with identifiers:`, { 
        id: bill.id, 
        state: billState,
        billNumber
      });
    }
  }, [bill, billState, billNumber]);

  // Fetch bill text when bill data is loaded
  useEffect(() => {
    const loadBillText = async () => {
      if (bill && id && !billText && !isLoadingText) {
        try {
          setIsLoadingText(true);
          
          // Use state+billNumber if available, fall back to id
          if (billState && billNumber) {
            console.log(`Fetching bill text for ${billState} bill ${billNumber}`);
            const textResult = await fetchBillText(id, billState, billNumber);
            
            if (textResult) {
              console.log("Successfully loaded bill text using state+billNumber");
              setBillText(textResult.text || null);
              
              // Update the bill object with the text content
              if (textResult.text) {
                bill.text = textResult.text;
              }
            }
          } else {
            console.log(`Fetching bill text with ID: ${id}`);
            const textResult = await fetchBillText(id, billState);
            
            if (textResult) {
              console.log("Successfully loaded bill text using billId");
              setBillText(textResult.text || null);
              
              // Update the bill object with the text content
              if (textResult.text) {
                bill.text = textResult.text;
              }
            }
          }
        } catch (error) {
          console.error("Error loading bill text:", error);
        } finally {
          setIsLoadingText(false);
        }
      }
    };
    
    loadBillText();
  }, [bill, id, billText, isLoadingText, billState, billNumber]);
  
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
        
        // Show a toast warning if we haven't shown one yet
        if (!hasShownApiWarning) {
          toast.warning("Some bill information may be limited due to API connectivity problems", {
            duration: 5000,
          });
          setHasShownApiWarning(true);
        }
      }
    } else {
      setIsApiDown(false);
    }
  }, [error, hasShownApiWarning]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsApiDown(false);
    setBillText(null);
    setHasShownApiWarning(false);
    toast.info("Attempting to reload bill data...");
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
