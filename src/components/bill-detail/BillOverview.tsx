
import { useState } from "react";
import { Bill } from "@/types";
import BillOverviewHeader from "./BillOverviewHeader";
import BillVersions from "./BillVersions";
import BillSponsors from "@/components/bill/BillSponsors";
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
      
      <Card className="bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Sponsors</h3>
        <BillSponsors bill={bill} />
      </Card>
      
      {/* Display bill versions if available */}
      {bill.versions && bill.versions.length > 0 && (
        <BillVersions versions={bill.versions} />
      )}
    </div>
  );
};

export default BillOverview;
