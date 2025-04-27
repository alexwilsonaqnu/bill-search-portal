
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
  
  // Extract bill data
  const { 
    ilgaUrl, 
    textHash, 
    legiscanBillId 
  } = BillDataExtractor({ bill });
  
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
        
        <BillResourceLinks 
          ilgaUrl={ilgaUrl} 
          isLoadingExternalContent={isLoadingExternalContent}
          fetchExternalContent={fetchExternalContent}
        />
        
        <BillTextHash 
          textHash={textHash} 
          billId={legiscanBillId}
          externalUrl={ilgaUrl} 
        />
        
        <BillHistoryView changes={bill.changes} />
      </div>
    </Card>
  );
};

export default BillOverviewHeader;
