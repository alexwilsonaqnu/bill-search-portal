
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, GitCompare, Upload } from "lucide-react";

interface BillDetailToolbarProps {
  bill: Bill;
  selectedTool: "overview" | "comparison" | "upload";
  setSelectedTool: (tool: "overview" | "comparison" | "upload") => void;
  showUploadOption?: boolean;
}

const BillDetailToolbar = ({ 
  bill, 
  selectedTool, 
  setSelectedTool,
  showUploadOption = false
}: BillDetailToolbarProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Analysis Tools</h3>
      
      <div className="space-y-2">
        <Button
          variant={selectedTool === "overview" ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => setSelectedTool("overview")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Overview
        </Button>
        
        <Button
          variant={selectedTool === "comparison" ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => setSelectedTool("comparison")}
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Versions
        </Button>
        
        {showUploadOption && (
          <Button
            variant={selectedTool === "upload" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setSelectedTool("upload")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Text
          </Button>
        )}
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
