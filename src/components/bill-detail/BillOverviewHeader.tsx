
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import BillBasicInfo from "./BillBasicInfo";
import BillResourceLinks from "./BillResourceLinks";
import BillTextHash from "./BillTextHash";
import BillHistoryView from "./BillHistoryView";
import BillDataExtractor from "./BillDataExtractor";
import BillContentLoader from "./BillContentLoader";

interface BillOverviewHeaderProps {
  bill: Bill;
  isLoadingExternalContent: boolean;
  setIsLoadingExternalContent: (isLoading: boolean) => void;
  setExternalContent: (content: string | null) => void;
}

const BillOverviewHeader = ({ 
  bill, 
  isLoadingExternalContent, 
  setIsLoadingExternalContent,
  setExternalContent
}: BillOverviewHeaderProps) => {
  
  // Extract bill data including state and billNumber
  const { 
    ilgaUrl, 
    textHash, 
    legiscanBillId,
    state,
    billNumber
  } = BillDataExtractor({ bill });
  
  // Log what approach we're using to fetch bill text
  console.log(`BillOverviewHeader: Using ${billNumber ? 'state+billNumber' : 'billId'} approach`, {
    state, 
    billNumber, 
    billId: legiscanBillId
  });
  
  // Get content loader
  const { fetchExternalContent } = BillContentLoader({ 
    ilgaUrl, 
    setExternalContent, 
    setIsLoadingExternalContent,
    isLoadingExternalContent
  });
  
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4">Bill Overview</h2>
      
      <div className="space-y-6">
        <BillBasicInfo bill={bill} />
        
        <BillResourceLinks bill={bill} />
        
        {/* Always pass both billId and state+billNumber */}
        <BillTextHash 
          textHash={textHash} 
          billId={legiscanBillId}
          state={state}
          billNumber={billNumber}
          externalUrl={ilgaUrl} 
        />
        
        <BillHistoryView bill={bill} />
      </div>
    </Card>
  );
};

export default BillOverviewHeader;
