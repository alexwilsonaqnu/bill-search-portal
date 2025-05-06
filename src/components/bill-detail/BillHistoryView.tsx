
import { Bill, Change } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parse, isValid } from "date-fns";

interface BillHistoryViewProps {
  bill: Bill;
}

const BillHistoryView = ({ bill }: BillHistoryViewProps) => {
  const changes = bill.changes || [];
  
  if (!changes || changes.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
        No history information available for this bill.
      </div>
    );
  }

  // Sort changes by date (newest first)
  const sortedChanges = [...changes].sort((a, b) => {
    const dateA = parseHistoryDate(a.details);
    const dateB = parseHistoryDate(b.details);
    
    if (isValid(dateA) && isValid(dateB)) {
      return dateB.getTime() - dateA.getTime();
    }
    return 0;
  });

  return (
    <div>
      <h3 className="font-semibold mb-2">Bill History</h3>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedChanges.map((change) => (
              <TableRow key={change.id}>
                <TableCell className="font-medium">
                  {formatHistoryDate(change.details)}
                </TableCell>
                <TableCell>
                  {change.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/**
 * Attempt to parse a date string from history details in various formats
 */
function parseHistoryDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date(0);
  
  // Try various date formats
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'yyyy-MM-dd HH:mm:ss'
  ];
  
  for (const formatStr of formats) {
    try {
      const parsedDate = parse(dateStr, formatStr, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (e) {
      // Continue to next format
    }
  }
  
  // If all parsing fails, try as a direct date
  const directDate = new Date(dateStr);
  if (isValid(directDate)) {
    return directDate;
  }
  
  return new Date(0);
}

/**
 * Format a date string for display
 */
function formatHistoryDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unknown date';
  
  const parsedDate = parseHistoryDate(dateStr);
  if (isValid(parsedDate) && parsedDate.getTime() > 0) {
    return format(parsedDate, 'MMM d, yyyy');
  }
  
  return dateStr;
}

export default BillHistoryView;
