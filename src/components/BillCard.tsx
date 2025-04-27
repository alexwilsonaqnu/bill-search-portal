
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
  // For debugging sponsor data
  console.log("Bill sponsors in card:", {
    id: bill.id,
    sponsor: bill.data?.sponsor || bill.data?.sponsors?.primary,
    cosponsors: bill.data?.cosponsors || bill.data?.sponsors?.cosponsors
  });

  return (
    <Card 
      className={`bill-card overflow-hidden animate-fade-up hover:shadow-md transition-all ${className}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <BillCardHeader bill={bill} />
      <CardContent>
        <BillSummary bill={bill} />
        <BillAction bill={bill} />
        <BillContentPreview bill={bill} />
        <BillSponsors bill={bill} />
        <BillFooter bill={bill} />
      </CardContent>
    </Card>
  );
};

export default BillCard;
