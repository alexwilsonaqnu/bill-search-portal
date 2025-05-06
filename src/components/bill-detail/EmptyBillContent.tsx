
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchBillText, fallbackBillText } from "@/services/billTextService";
import BillTextLoading from "./BillTextLoading";

interface EmptyBillContentProps {
  bill: Bill;
  ilgaUrl: string | null;
}

const EmptyBillContent = ({ bill, ilgaUrl }: EmptyBillContentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show the empty content if we have any text content
  const showEmptyContent = !bill.data || 
    (!bill.data.text_content && 
     !bill.data.full_text && 
     (!bill.data.texts || bill.data.texts.length === 0) &&
     !bill.data.text_hash);

  if (!showEmptyContent) return null;

  const fetchLegiscanText = async () => {
    setIsLoading(true);
    setError(null);
    toast("Fetching bill text from LegiScan...");
    
    try {
      await fetchBillText(bill.id);
      toast("Successfully loaded bill text");
      window.location.reload();
    } catch (error) {
      console.error("Failed to fetch bill text:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast("Failed to fetch bill text from LegiScan");
      setError(errorMessage);
      
      // Use fallback text after API failure
      try {
        console.log("Using fallback bill text after API failure");
        const fallbackContent = await fallbackBillText(bill.id, bill.title);
        localStorage.setItem(`bill_text_${bill.id}`, JSON.stringify(fallbackContent));
        toast("Loaded fallback bill content");
        window.location.reload();
      } catch (fallbackError) {
        console.error("Failed to use fallback text:", fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <div className="text-center py-8">
        <h3 className="text-xl font-medium text-gray-700 mb-2">No Bill Text Available</h3>
        <p className="text-gray-600 mb-6">
          The text for this bill is not currently available. Click below to fetch it from LegiScan.
        </p>
        
        {error && (
          <div className="mb-4 text-left">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                The LegiScan API may be temporarily unavailable. Please try again later.
              </p>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <BillTextLoading isLoading={true} onFetchText={() => {}} />
        ) : (
          <Button onClick={fetchLegiscanText} disabled={isLoading}>
            Fetch Text from LegiScan
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EmptyBillContent;
