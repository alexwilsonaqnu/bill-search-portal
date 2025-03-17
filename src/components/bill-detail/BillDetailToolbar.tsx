
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, GitCompare } from "lucide-react";

interface BillDetailToolbarProps {
  bill: Bill;
  selectedTool: "overview" | "comparison";
  setSelectedTool: (tool: "overview" | "comparison") => void;
}

const BillDetailToolbar = ({ 
  bill, 
  selectedTool, 
  setSelectedTool
}: BillDetailToolbarProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">
        <span className="text-[#35B7CD]">Bill</span>
        <span className="text-[#8CC63F]">inois</span>
        <span className="text-gray-700"> Choose Tool</span>
      </h3>
      
      <div className="space-y-2">
        <Button
          variant={selectedTool === "overview" ? "default" : "outline"}
          className={`w-full justify-start ${selectedTool === "overview" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""}`}
          onClick={() => setSelectedTool("overview")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Overall view
        </Button>
        
        <Button
          variant={selectedTool === "comparison" ? "default" : "outline"}
          className={`w-full justify-start ${selectedTool === "comparison" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""}`}
          onClick={() => setSelectedTool("comparison")}
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Comparison Tool
        </Button>
      </div>
      
      {/* Display additional info or bill stats here */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium mb-3">Bill Information</h4>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">ID:</span> {bill.id}
          </p>
          {bill.lastUpdated && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Last Updated:</span> {bill.lastUpdated}
            </p>
          )}
          {bill.status && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> {bill.status}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BillDetailToolbar;
