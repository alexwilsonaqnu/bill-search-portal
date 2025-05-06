
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { fetchBillText } from "@/services/billTextService";
import BillTextLoading from "./BillTextLoading";

interface EmptyBillContentProps {
  bill: Bill;
  ilgaUrl: string | null;
}

const EmptyBillContent = ({ bill, ilgaUrl }: EmptyBillContentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Don't show the empty content if we have any text content
  const showEmptyContent = !bill.data || 
    (!bill.data.text_content && 
     !bill.data.full_text && 
     (!bill.data.texts || bill.data.texts.length === 0) &&
     !bill.data.text_hash);

  if (!showEmptyContent) return null;

  const fetchLegiscanText = async () => {
    setIsLoading(true);
    toast.info("Fetching bill text from LegiScan...");
    
    try {
      await fetchBillText(bill.id);
      // After fetching, we need to reload the bill data
      window.location.reload();
    } catch (error) {
      console.error("Failed to fetch bill text:", error);
      toast.error("Failed to fetch bill text from LegiScan");
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
        
        {isLoading ? (
          <BillTextLoading isLoading={true} onFetchText={() => {}} />
        ) : (
          <Button onClick={fetchLegiscanText}>
            Fetch Text from LegiScan
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EmptyBillContent;
