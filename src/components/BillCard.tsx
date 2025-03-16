
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Bill } from "@/types";
import { Link } from "react-router-dom";

interface BillCardProps {
  bill: Bill;
  className?: string;
  animationDelay?: string;
}

const BillCard = ({ bill, className = "", animationDelay }: BillCardProps) => {
  return (
    <Card 
      className={`bill-card overflow-hidden animate-fade-up ${className}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
          <Info className="h-6 w-6 text-gray-500" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-1">{bill.id}: {bill.title}</h3>
          <p className="text-gray-600 text-sm mb-4">{bill.description}</p>
          <Link to={`/bill/${bill.id}`}>
            <Button 
              className="select-button"
              variant="default"
            >
              SELECT
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default BillCard;
