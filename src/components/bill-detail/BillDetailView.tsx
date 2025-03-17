
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Bill } from "@/types";
import Navbar from "@/components/Navbar";
import BillDetailToolbar from "./BillDetailToolbar";
import BillOverview from "./BillOverview";
import BillComparisonContainer from "./BillComparisonContainer";
import BillSponsors from "@/components/bill/BillSponsors";
import BillTextUploader from "./BillTextUploader";
import BillNotificationSignup from "./BillNotificationSignup";

interface BillDetailViewProps {
  bill: Bill;
}

const BillDetailView = ({ bill }: BillDetailViewProps) => {
  const [selectedTool, setSelectedTool] = useState<"overview" | "comparison" | "upload">("overview");
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);

  const handleUploadComplete = (content: string) => {
    setUploadedContent(content);
    setSelectedTool("overview");
  };

  return (
    <div className="min-h-screen bg-gray-50 page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-6xl mx-auto pt-28 pb-20 px-6">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to search
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{bill.title}</h1>
        
        {/* Add bill sponsors below the title */}
        <div className="mb-8">
          <BillSponsors bill={bill} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <BillDetailToolbar 
              bill={bill} 
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool} 
              showUploadOption={true}
            />
            
            {/* Add the notification signup component */}
            <BillNotificationSignup bill={bill} />
          </div>
          
          <div className="md:col-span-2">
            {selectedTool === "overview" ? (
              <BillOverview bill={uploadedContent ? {...bill, data: {...bill.data, text_content: uploadedContent}} : bill} />
            ) : selectedTool === "comparison" ? (
              <BillComparisonContainer bill={bill} />
            ) : (
              <BillTextUploader billId={bill.id} onUploadComplete={handleUploadComplete} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetailView;
