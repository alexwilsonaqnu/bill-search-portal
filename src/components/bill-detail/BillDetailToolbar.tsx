
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import ChangeIndex from "@/components/ChangeIndex";
import { Bill } from "@/types";

interface BillDetailToolbarProps {
  bill: Bill;
  selectedTool: "overview" | "comparison";
  setSelectedTool: (tool: "overview" | "comparison") => void;
}

const BillDetailToolbar = ({ bill, selectedTool, setSelectedTool }: BillDetailToolbarProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mb-6 sticky top-28">
      <h2 className="text-xl font-semibold mb-1">Billinois</h2>
      <h3 className="text-lg mb-6">Choose Tool</h3>
      
      <div className="space-y-4">
        <button 
          onClick={() => setSelectedTool("overview")}
          className={cn(
            "flex items-start w-full text-left px-3 py-2 rounded-md transition-colors",
            selectedTool === "overview" 
              ? "bg-gray-100" 
              : "hover:bg-gray-50"
          )}
        >
          <Star className="h-5 w-5 mr-3 mt-0.5" />
          <div>
            <div className="font-medium">Overall view</div>
            <div className="text-sm text-gray-600">See overall bill information</div>
          </div>
        </button>
        
        <button 
          onClick={() => setSelectedTool("comparison")}
          className={cn(
            "flex items-start w-full text-left px-3 py-2 rounded-md transition-colors",
            selectedTool === "comparison" 
              ? "bg-gray-100" 
              : "hover:bg-gray-50"
          )}
        >
          <Star className="h-5 w-5 mr-3 mt-0.5" />
          <div>
            <div className="font-medium">Comparison Tool</div>
            <div className="text-sm text-gray-600">Compare different versions of the bill</div>
          </div>
        </button>
      </div>
      
      {bill.changes && bill.changes.length > 0 && (
        <div className="mt-8">
          <ChangeIndex changes={bill.changes} />
        </div>
      )}
    </div>
  );
};

export default BillDetailToolbar;
