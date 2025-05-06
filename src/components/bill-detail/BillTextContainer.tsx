
import { useEffect, useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillTextHash from "./BillTextHash";
import BillTextContent from "./BillTextContent";
import { fetchBillText } from "@/services/legiscan";
import { fallbackBillText } from "@/services/billTextService";
import { toast } from "sonner";
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
  
  // Always try to fetch text on mount
  useEffect(() => {
    const loadBillText = async () => {
      if (bill.id && !textLoaded && retries < MAX_RETRIES) {
        setIsLoading(true);
        setErrorMessage(null);
        
        try {
          await fetchBillText(bill.id);
          setTextLoaded(true);
          console.log("Successfully loaded bill text");
          // We don't need to reload the page as the components will handle displaying the text
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
    toast.info("Fetching bill text from LegiScan...");
    
    try {
      await fetchBillText(bill.id);
      setTextLoaded(true);
      toast.success("Successfully loaded bill text");
    } catch (error) {
      console.error("Failed to fetch bill text:", error);
      toast.error("Failed to fetch bill text from LegiScan");
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
