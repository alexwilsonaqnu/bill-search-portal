import { useState } from "react";
import { Bill } from "@/types";
import BillOverviewHeader from "./BillOverviewHeader";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  const [externalContent, setExternalContent] = useState<string | null>(null);

  console.log("Bill data in overview:", {
    id: bill.id,
    hasVersions: bill.versions?.length > 0,
    hasData: !!bill.data,
    billDataKeys: bill.data ? Object.keys(bill.data) : [],
    externalContent: !!externalContent
  });
  
  return (
    <div className="space-y-6">
      <BillOverviewHeader 
        bill={bill}
        isLoadingExternalContent={isLoadingExternalContent}
        setIsLoadingExternalContent={setIsLoadingExternalContent}
        setExternalContent={setExternalContent}
      />
    </div>
  );
};

export default BillOverview;
