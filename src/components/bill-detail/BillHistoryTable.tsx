
import { Change } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface BillHistoryTableProps {
  changes: Change[];
}

const BillHistoryTable = ({ changes }: BillHistoryTableProps) => {
  // Sort changes by date (most recent first)
  const sortedChanges = [...changes].sort((a, b) => {
    const dateA = a.details ? new Date(a.details) : new Date(0);
    const dateB = b.details ? new Date(b.details) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedChanges.map((change) => (
            <TableRow key={change.id}>
              <TableCell className="whitespace-nowrap">
                {change.details && format(new Date(change.details), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>{change.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BillHistoryTable;
