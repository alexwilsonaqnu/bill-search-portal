
import { Change } from "@/types";

interface BillHistoryViewProps {
  changes: Change[];
}

const BillHistoryView = ({ changes }: BillHistoryViewProps) => {
  if (!changes || changes.length === 0) return null;
  
  return (
    <div>
      <h3 className="font-semibold mb-2">Bill History</h3>
      <ul className="list-disc pl-5 space-y-1">
        {changes.map((change) => (
          <li key={change.id} className="text-gray-700">
            <span>{change.description}</span>
            {change.details && <span className="text-gray-500 ml-2">({change.details})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BillHistoryView;
