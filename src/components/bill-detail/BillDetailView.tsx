
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Bill } from "@/types";
import BillDetailToolbar from "./BillDetailToolbar";
import BillOverview from "./BillOverview";
import BillComparisonContainer from "./BillComparisonContainer";
import StatutoryEffectsContainer from "./StatutoryEffectsContainer";
import BillNotificationSignup from "./BillNotificationSignup";
import BillTextContainer from "./BillTextContainer";
import KeyInsightsCard from "./KeyInsightsCard";
import ChatToggle from "./ChatToggle";
import BillChat from "./BillChat";
import AmendmentsIndex from "./statutory/AmendmentsIndex";
import { SidebarProvider, Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";

interface BillDetailViewProps {
  bill: Bill;
}

const BillDetailView = ({ bill }: BillDetailViewProps) => {
  const [selectedTool, setSelectedTool] = useState<"overview" | "comparison" | "statutory-effects">("overview");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Get the bill version and date information
  const versionInfo = bill.data?.bill_number ? 
    `${bill.data.bill_number} | v${bill.versions?.length || "1.0"}` : 
    `Bill ID: ${bill.id}`;
    
  const lastUpdated = bill.lastUpdated ? 
    `(Last updated: ${new Date(bill.lastUpdated).toLocaleDateString()})` : 
    "";

  // Enhanced bill text extraction to get the most comprehensive text available
  const getBillText = () => {
    console.log("Extracting bill text for chat...");
    
    // Priority 1: Check cached bill text first (most likely to be complete)
    try {
      const cachedText = localStorage.getItem(`bill_text_${bill.id}`);
      if (cachedText) {
        const cached = JSON.parse(cachedText);
        if (cached.text && cached.text.trim().length > 100) {
          console.log(`Using cached bill text: ${cached.text.length} characters`);
          return cached.text;
        }
      }
    } catch (e) {
      console.warn("Error reading cached text:", e);
    }
    
    // Priority 2: Direct text property
    if (bill.text && bill.text.trim().length > 100) {
      console.log(`Using bill.text: ${bill.text.length} characters`);
      return bill.text;
    }
    
    // Priority 3: Data text properties
    if (bill.data?.text && bill.data.text.trim().length > 100) {
      console.log(`Using bill.data.text: ${bill.data.text.length} characters`);
      return bill.data.text;
    }
    
    if (bill.data?.bill?.text && bill.data.bill.text.trim().length > 100) {
      console.log(`Using bill.data.bill.text: ${bill.data.bill.text.length} characters`);
      return bill.data.bill.text;
    }
    
    // Priority 4: Check versions for the most comprehensive text
    if (bill.versions && bill.versions.length > 0) {
      // Try to find the latest or most complete version
      let bestVersionText = "";
      for (const version of bill.versions) {
        if (version.sections && version.sections.length > 0) {
          const versionText = version.sections.map(section => section.content).join('\n\n');
          if (versionText.length > bestVersionText.length) {
            bestVersionText = versionText;
          }
        }
      }
      if (bestVersionText.trim().length > 100) {
        console.log(`Using version text: ${bestVersionText.length} characters`);
        return bestVersionText;
      }
    }
    
    // Priority 5: Fallback to basic bill info
    const fallbackText = [
      bill.title || "Bill Title Not Available",
      bill.description || "",
      bill.data?.bill?.description || "",
      bill.data?.summary || ""
    ].filter(Boolean).join('\n\n');
    
    console.log(`Using fallback text: ${fallbackText.length} characters`);
    return fallbackText.trim() || `This is ${bill.data?.bill_number || `Bill ${bill.id}`}. Full text is not currently available.`;
  };

  const billText = getBillText();
  console.log(`Final bill text for chat: ${billText.length} characters`);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 page-transition-wrapper w-full flex">
        {/* Collapsible Sidebar */}
        <Sidebar className="border-r bg-white" collapsible="icon">
          <SidebarContent className="p-4">
            <BillDetailToolbar 
              bill={bill} 
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
            />
            
            {/* New Amendments Index Container for Statutory Effects */}
            {selectedTool === "statutory-effects" && (
              <div className="mt-6">
                {/* This will be populated by the StatutoryEffectsAnalyzer */}
              </div>
            )}
            
            <BillNotificationSignup bill={bill} />
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area with proper spacing for collapsed sidebar */}
        <div className="flex-1 flex flex-col peer-data-[state=collapsed]:ml-0">
          {/* Header without trigger button */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to search
              </Link>
            </div>
            
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-1">{bill.title}</h1>
              <p className="text-gray-600">{versionInfo} {lastUpdated}</p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 px-6 pb-20">
            {selectedTool === "overview" ? (
              <div className="space-y-6">
                {/* Bill Overview Card */}
                <BillOverview bill={bill} />
                
                {/* Bill Text Card - Full Width */}
                <BillTextContainer bill={bill} />
                
                {/* Key Insights Card - Full Width */}
                <KeyInsightsCard bill={bill} />
              </div>
            ) : selectedTool === "comparison" ? (
              <BillComparisonContainer bill={bill} />
            ) : (
              <StatutoryEffectsContainer bill={bill} />
            )}
          </div>
        </div>

        {/* Chat Toggle Button */}
        {billText && (
          <div className="fixed bottom-4 left-4 z-10">
            <ChatToggle onClick={toggleChat} isOpen={isChatOpen} />
          </div>
        )}

        {/* Chat Interface */}
        {billText && (
          <BillChat 
            billText={billText} 
            isOpen={isChatOpen} 
            onClose={toggleChat} 
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default BillDetailView;
