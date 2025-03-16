import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Bill } from "@/types";
import { Link } from "react-router-dom";

interface BillCardProps {
  bill: Bill;
  className?: string;
  animationDelay?: string;
}

const BillCard = ({ bill, className = "", animationDelay }: BillCardProps) => {
  const formatTitle = () => {
    if (bill.title && bill.title.length > 10 && !bill.title.includes(bill.id)) {
      return bill.title;
    }
    return `${bill.title || "House Bill"} - ${bill.description.split('.')[0] || "Legislative Proposal"}`;
  };

  const getSummary = () => {
    if (!bill.description) return "No description available";
    if (bill.description.length < 120) return bill.description;
    return bill.description.substring(0, 120) + "...";
  };

  return (
    <Card 
      className={`bill-card overflow-hidden animate-fade-up ${className}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {bill.id}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Last updated: {bill.lastUpdated || "N/A"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-medium mb-2 text-blue-800">{formatTitle()}</h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{getSummary()}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {bill.status && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {bill.status}
              </span>
            )}
            {bill.versions && bill.versions.length > 0 && (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {bill.versions.length} version{bill.versions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link to={`/bill/${bill.id}`} className="ml-auto">
            <Button 
              className="select-button"
              variant="default"
              size="sm"
            >
              VIEW DETAILS
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillCard;
