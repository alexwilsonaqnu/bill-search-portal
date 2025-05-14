
import { useEffect, useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillTextHash from "./BillTextHash";
import BillTextContent from "./BillTextContent";
import { fetchBillText } from "@/services/billTextService";
import { fallbackBillText } from "@/services/billTextService";
import { toast } from "@/components/ui/use-toast";
import BillTextLoading from "./BillTextLoading";

interface BillTextContainerProps {
  bill: Bill;
}

const BillTextContainer = ({ bill }: BillTextContainerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textLoaded, setTextLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const MAX_RETRIES = 2;

  // Always default to IL for state
  const state = bill.state || 'IL';
  const billNumber = bill.data?.bill_number || null;
  
  // Always try to fetch text on mount
  useEffect(() => {
    // First check if we've already cached the text content
    const checkCachedText = () => {
      try {
        const cachedText = localStorage.getItem(`bill_text_${bill.id}`);
        if (cachedText) {
          console.log(`Using cached bill text for ID: ${bill.id}`);
          setTextLoaded(true);
          return true;
        }
      } catch (e) {
        console.warn("Error retrieving text from cache:", e);
      }
      return false;
    };

    const loadBillText = async () => {
      if (bill.id && !textLoaded && retries < MAX_RETRIES && !checkCachedText()) {
        setIsLoading(true);
        setErrorMessage(null);
        
        try {
          console.log(`Attempting to load text for bill ID: ${bill.id}`);
          const result = await fetchBillText(bill.id);
          console.log("Successfully fetched bill text:", result);
          
          // Cache the successful result
          try {
            localStorage.setItem(`bill_text_${bill.id}`, JSON.stringify(result));
          } catch (storageError) {
            console.warn(`Failed to cache bill text: ${storageError}`);
          }
          
          setTextLoaded(true);
        } catch (error) {
          console.error("Error auto-loading bill text:", error);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load bill text");
          
          // Try to use fallback content
          try {
            if (retries === MAX_RETRIES - 1) {
              console.log("Using fallback bill text after failed attempts");
              const fallbackContent = await fallbackBillText(bill.id, bill.title);
              // Store fallback content in local storage to make it available for components
              localStorage.setItem(`bill_text_${bill.id}`, JSON.stringify(fallbackContent));
              setTextLoaded(true);
            }
          } catch (fallbackError) {
            console.error("Failed to use fallback text:", fallbackError);
          }
          
          setRetries(prev => prev + 1);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadBillText();
  }, [bill.id, textLoaded, retries]);

  const billId = bill.id;
  const textHash = bill.data?.text_hash || null;
  const externalUrl = bill.data?.text_url || null;
  
  const handleFetchText = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    toast.info("Fetching bill text", {
      description: "Loading text from LegiScan..."
    });
    
    try {
      await fetchBillText(bill.id);
      setTextLoaded(true);
      toast.success("Success", {
        description: "Successfully loaded bill text"
      });
    } catch (error) {
      console.error("Failed to fetch bill text:", error);
      toast.error("Error", {
        description: "Failed to fetch bill text from LegiScan"
      });
      setErrorMessage(error instanceof Error ? error.message : "Failed to load bill text");
      
      // Use fallback text after manual fetch fails
      try {
        console.log("Using fallback bill text after manual fetch failed");
        const fallbackContent = await fallbackBillText(bill.id, bill.title);
        localStorage.setItem(`bill_text_${bill.id}`, JSON.stringify(fallbackContent));
        setTextLoaded(true);
      } catch (fallbackError) {
        console.error("Failed to use fallback text:", fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Bill Text</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <BillTextLoading isLoading={true} onFetchText={() => {}} />
        ) : textHash ? (
          <BillTextHash 
            textHash={textHash} 
            billId={billId} 
            state={state}
            billNumber={billNumber}
            externalUrl={externalUrl} 
            autoFetch={true}
            errorMessage={errorMessage}
          />
        ) : (
          <>
            <BillTextContent 
              bill={bill}
              externalUrl={externalUrl}
              errorMessage={errorMessage}
            />
            {!bill.text && !isLoading && !textLoaded && (
              <div className="mt-4">
                <BillTextLoading 
                  isLoading={false} 
                  onFetchText={handleFetchText} 
                  errorMessage={errorMessage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillTextContainer;
