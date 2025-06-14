
import { Bill } from "@/types";
import { Button } from "@/components/ui/button";
import { FileText, GitCompare, Scale } from "lucide-react";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

interface BillDetailToolbarProps {
  bill: Bill;
  selectedTool: "overview" | "comparison" | "statutory-effects";
  setSelectedTool: (tool: "overview" | "comparison" | "statutory-effects") => void;
}

const BillDetailToolbar = ({ 
  bill, 
  selectedTool, 
  setSelectedTool
}: BillDetailToolbarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="space-y-4">
      {/* Header with Billinois title and sidebar trigger */}
      <div className="flex items-center justify-between">
        <Link 
          to="/"
          className="inline-block transition-transform duration-300 hover:scale-105"
          aria-label="Billinois Home"
        >
          <h1 className={`font-bold billinois-logo ${isCollapsed ? 'text-lg' : 'text-xl'}`}>
            {isCollapsed ? 'B' : 'Billinois'}
          </h1>
        </Link>
        <SidebarTrigger className="min-h-10 min-w-10" />
      </div>
      
      {!isCollapsed && (
        <h3 className="text-lg font-semibold">
          <span className="text-gray-700">Choose Tool</span>
        </h3>
      )}
      
      <div className="space-y-2">
        <Button
          variant={selectedTool === "overview" ? "default" : "outline"}
          className={`w-full ${isCollapsed ? 'h-10 p-2 flex items-center justify-center' : 'justify-start'} ${selectedTool === "overview" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""}`}
          onClick={() => setSelectedTool("overview")}
          size={isCollapsed ? "icon" : "default"}
        >
          <FileText className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && "Overall view"}
        </Button>
        
        <Button
          variant={selectedTool === "comparison" ? "default" : "outline"}
          className={`w-full ${isCollapsed ? 'h-10 p-2 flex items-center justify-center' : 'justify-start'} ${selectedTool === "comparison" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""}`}
          onClick={() => setSelectedTool("comparison")}
          size={isCollapsed ? "icon" : "default"}
        >
          <GitCompare className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && "Comparison Tool"}
        </Button>
        
        <Button
          variant={selectedTool === "statutory-effects" ? "default" : "outline"}
          className={`w-full ${isCollapsed ? 'h-10 p-2 flex items-center justify-center' : 'justify-start'} ${selectedTool === "statutory-effects" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""}`}
          onClick={() => setSelectedTool("statutory-effects")}
          size={isCollapsed ? "icon" : "default"}
        >
          <Scale className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && "Statutory effects"}
        </Button>
      </div>
      
      {!isCollapsed && (
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
      )}
    </div>
  );
};

export default BillDetailToolbar;
