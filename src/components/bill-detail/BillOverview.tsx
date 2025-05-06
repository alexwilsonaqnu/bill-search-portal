
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillResourceLinks from "./BillResourceLinks";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  // Extract description from the bill data
  const description = bill.description || bill.data?.description || "No description available";
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Bill Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700">
            {description}
          </p>
          
          <BillResourceLinks bill={bill} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BillOverview;
