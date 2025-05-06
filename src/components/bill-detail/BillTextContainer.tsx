
import { useEffect, useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillTextHash from "./BillTextHash";
import BillTextContent from "./BillTextContent";
import { fetchBillText } from "@/services/billTextService";
import { toast } from "sonner";
import BillTextLoading from "./BillTextLoading";

interface BillTextContainerProps {
  bill: Bill;
}

const BillTextContainer = ({ bill }: BillTextContainerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textLoaded, setTextLoaded] = useState(false);
  
  // Always try to fetch text on mount
  useEffect(() => {
    const loadBillText = async () => {
      if (bill.id && !textLoaded) {
        setIsLoading(true);
        try {
          await fetchBillText(bill.id);
          setTextLoaded(true);
          // We don't need to reload the page as the components will handle displaying the text
        } catch (error) {
          console.error("Error auto-loading bill text:", error);
          // Don't show an error toast here as we'll just show the fetch button instead
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadBillText();
  }, [bill.id, textLoaded]);

  const billId = bill.id;
  const textHash = bill.data?.text_hash || null;
  const externalUrl = bill.data?.text_url || null;
  
  const handleFetchText = async () => {
    setIsLoading(true);
    toast.info("Fetching bill text from LegiScan...");
    
    try {
      await fetchBillText(bill.id);
      window.location.reload();
    } catch (error) {
      console.error("Failed to fetch bill text:", error);
      toast.error("Failed to fetch bill text from LegiScan");
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
          />
        ) : (
          <>
            <BillTextContent 
              bill={bill}
              externalUrl={externalUrl}
            />
            {!bill.text && !isLoading && (
              <div className="mt-4">
                <BillTextLoading isLoading={false} onFetchText={handleFetchText} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillTextContainer;
