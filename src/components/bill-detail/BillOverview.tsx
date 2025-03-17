
import { useState } from "react";
import { Bill } from "@/types";
import BillOverviewHeader from "./BillOverviewHeader";
import BillContentSection from "./BillContentSection";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  const [externalContent, setExternalContent] = useState<string | null>(null);
  
  console.log("Bill data:", {
    billDataKeys: bill.data ? Object.keys(bill.data) : []
  });
  
  return (
    <div className="space-y-6">
      <BillOverviewHeader 
        bill={bill} 
        isLoadingExternalContent={isLoadingExternalContent}
        setIsLoadingExternalContent={setIsLoadingExternalContent}
        setExternalContent={setExternalContent}
      />
      
      <BillContentSection bill={externalContent ? {...bill, data: {...bill.data, text_content: externalContent}} : bill} />
    </div>
  );
};

export default BillOverview;
