
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Bill } from "@/types";
import Navbar from "@/components/Navbar";
import BillDetailToolbar from "./BillDetailToolbar";
import BillOverview from "./BillOverview";
import BillComparisonContainer from "./BillComparisonContainer";
import BillNotificationSignup from "./BillNotificationSignup";
import BillTextContainer from "./BillTextContainer";
import KeyInsightsCard from "./KeyInsightsCard";
import ChatToggle from "./ChatToggle";
import BillChat from "./BillChat";

interface BillDetailViewProps {
  bill: Bill;
}

const BillDetailView = ({ bill }: BillDetailViewProps) => {
  const [selectedTool, setSelectedTool] = useState<"overview" | "comparison">("overview");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Get the bill version and date information
  const versionInfo = bill.data?.bill_number ? 
    `${bill.data.bill_number} | v${bill.versions?.length || "1.0"}` : 
    `Bill ID: ${bill.id}`;
    
  const lastUpdated = bill.lastUpdated ? 
    `(Last updated: ${new Date(bill.lastUpdated).toLocaleDateString()})` : 
    "";

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 page-transition-wrapper w-full">
      <Navbar />
      
      <div className="max-w-6xl mx-auto pt-28 pb-20 px-6">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to search
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{bill.title}</h1>
          <p className="text-gray-600">{versionInfo} {lastUpdated}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left sidebar */}
          <div className="md:col-span-1">
            <BillDetailToolbar 
              bill={bill} 
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
            />
            
            <BillNotificationSignup bill={bill} />
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-2">
            {selectedTool === "overview" ? (
              <>
                {/* Bill Overview Card */}
                <BillOverview bill={bill} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Bill Text Card */}
                  <BillTextContainer bill={bill} />
                  
                  {/* Key Insights Card */}
                  <KeyInsightsCard bill={bill} />
                </div>
              </>
            ) : (
              <BillComparisonContainer bill={bill} />
            )}
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 left-4 z-10">
        <ChatToggle onClick={toggleChat} isOpen={isChatOpen} />
      </div>

      {/* Chat Interface */}
      <BillChat 
        billText={bill.content || bill.data?.text} 
        isOpen={isChatOpen} 
        onClose={toggleChat} 
      />
    </div>
  );
};

export default BillDetailView;
