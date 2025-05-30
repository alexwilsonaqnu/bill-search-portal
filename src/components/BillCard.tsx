
import { Card, CardContent } from "@/components/ui/card";
import { Bill } from "@/types";
import BillCardHeader from "@/components/bill/BillCardHeader";
import BillSummary from "@/components/bill/BillSummary";
import BillAction from "@/components/bill/BillAction";
import BillContentPreview from "@/components/bill/BillContentPreview";
import BillSponsors from "@/components/bill/BillSponsors";
import BillFooter from "@/components/bill/BillFooter";

interface BillCardProps {
  bill: Bill;
  className?: string;
  animationDelay?: string;
}

const BillCard = ({ bill, className = "", animationDelay }: BillCardProps) => {
  // Process bill data to ensure we have sponsor information accessible
  const processedBill = {
    ...bill,
    // Ensure sponsor is properly exposed at the top level
    sponsor: bill.sponsor || null,
    cosponsors: bill.cosponsors || [],
    // Ensure any data from search API is properly structured
    data: bill.data ? {
      ...bill.data,
      // Ensure sponsor data is properly structured
      sponsor: bill.sponsor || bill.data.sponsor || 
              (bill.data.sponsors?.primary ? bill.data.sponsors.primary : null) ||
              (Array.isArray(bill.data.sponsors) && bill.data.sponsors.length > 0 ? 
                bill.data.sponsors[0] : null),
      // Ensure cosponsors data is properly structured
      cosponsors: bill.cosponsors || bill.data.cosponsors ||
                 (bill.data.sponsors?.cosponsors ? bill.data.sponsors.cosponsors : []) ||
                 (Array.isArray(bill.data.sponsors) && bill.data.sponsors.length > 1 ? 
                   bill.data.sponsors.slice(1) : [])
    } : {}
  };

  return (
    <Card 
      className={`bill-card overflow-hidden animate-fade-up hover:shadow-md transition-all ${className}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <BillCardHeader bill={processedBill} />
      <CardContent>
        <BillSummary bill={processedBill} />
        <BillAction bill={processedBill} />
        <BillContentPreview bill={processedBill} />
        <BillSponsors bill={processedBill} />
        <BillFooter bill={processedBill} />
      </CardContent>
    </Card>
  );
};

export default BillCard;
