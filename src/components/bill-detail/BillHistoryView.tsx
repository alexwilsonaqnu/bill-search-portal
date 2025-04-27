
import { Change } from "@/types";
import { Card } from "@/components/ui/card";
import BillHistoryTable from "./BillHistoryTable";

interface BillHistoryViewProps {
  changes: Change[];
}

const BillHistoryView = ({ changes }: BillHistoryViewProps) => {
  console.log('Bill History Changes from Props:', changes);
  console.log('Number of Changes:', changes?.length);

  if (!changes || changes.length === 0) return null;
  
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Bill History</h3>
      <BillHistoryTable changes={changes} />
    </Card>
  );
};

export default BillHistoryView;
