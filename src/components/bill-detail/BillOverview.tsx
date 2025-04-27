
import { useState } from "react";
import { Bill } from "@/types";
import BillOverviewHeader from "./BillOverviewHeader";
import { Card } from "@/components/ui/card";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  const [externalContent, setExternalContent] = useState<string | null>(null);
  
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
