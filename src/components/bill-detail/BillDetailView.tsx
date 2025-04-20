
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Bill } from "@/types";
import Navbar from "@/components/Navbar";
import BillDetailToolbar from "./BillDetailToolbar";
import BillOverview from "./BillOverview";
import BillComparisonContainer from "./BillComparisonContainer";
import BillSponsors from "@/components/bill/BillSponsors";
import BillNotificationSignup from "./BillNotificationSignup";
import BillChat from "./BillChat";
import ChatToggle from "./ChatToggle";
import { SidebarProvider } from "@/components/ui/sidebar";

interface BillDetailViewProps {
  bill: Bill;
}

const BillDetailView = ({ bill }: BillDetailViewProps) => {
  const [selectedTool, setSelectedTool] = useState<"overview" | "comparison">("overview");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Get the bill text from either the text property or from versions if available
  const billText = bill.text || (bill.versions?.[0]?.sections?.[0]?.content || "");

  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-gray-50 page-transition-wrapper w-full ${isChatOpen ? 'pl-[350px]' : ''} transition-[padding] duration-300`}>
        <Navbar />
        
        <div className="max-w-6xl mx-auto pt-28 pb-20 px-6">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to search
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{bill.title}</h1>
          
          <div className="mb-8">
            <BillSponsors bill={bill} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <BillDetailToolbar 
                bill={bill} 
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
              />
              
              <BillNotificationSignup bill={bill} />
            </div>
            
            <div className="md:col-span-2">
              {selectedTool === "overview" ? (
                <BillOverview bill={bill} />
              ) : (
                <BillComparisonContainer bill={bill} />
              )}
            </div>
          </div>
        </div>

        <ChatToggle 
          isOpen={isChatOpen} 
          onClick={() => setIsChatOpen(!isChatOpen)} 
        />

        {isChatOpen && <BillChat billText={billText} />}
      </div>
    </SidebarProvider>
  );
};

export default BillDetailView;
