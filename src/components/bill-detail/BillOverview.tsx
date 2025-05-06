
import { useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillResourceLinks from "./BillResourceLinks";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract description from the bill data
  const description = bill.description || bill.data?.description || "No description available";
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Bill Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add bill title */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Title</h3>
            <p className="text-gray-700">
              {bill.title}
            </p>
          </div>
          
          <h3 className="font-semibold mb-2">Description</h3>
          <div>
            <div 
              className={`text-gray-700 ${!isExpanded ? "line-clamp-6" : ""}`}
            >
              {description}
            </div>
            {description.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpand}
                className="mt-2 text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" /> Show More
                  </>
                )}
              </Button>
            )}
          </div>
          
          <BillResourceLinks bill={bill} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BillOverview;
