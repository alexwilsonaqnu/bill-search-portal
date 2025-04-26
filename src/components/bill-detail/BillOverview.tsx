
import { useState } from "react";
import { Bill } from "@/types";
import BillOverviewHeader from "./BillOverviewHeader";
import BillVersions from "./BillVersions";

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
      
      {/* Display bill versions if available */}
      {bill.versions && bill.versions.length > 0 && (
        <BillVersions versions={bill.versions} />
      )}
    </div>
  );
};

export default BillOverview;
