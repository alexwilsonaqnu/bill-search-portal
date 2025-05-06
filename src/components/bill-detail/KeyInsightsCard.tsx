
import { useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Percent, Users } from "lucide-react";
import BillSponsors from "@/components/bill/BillSponsors";
import BillHistoryView from "./BillHistoryView";

interface KeyInsightsCardProps {
  bill: Bill;
}

type InsightTab = "sponsors" | "passPercent" | "history";

const KeyInsightsCard = ({ bill }: KeyInsightsCardProps) => {
  const [activeTab, setActiveTab] = useState<InsightTab>("sponsors");
  
  // Placeholder data for newsworthy score - would come from real data
  const newsworthyScore = 97;
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Newsworthy score section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="border border-green-300 rounded-md p-4 bg-white text-center">
              <p className="text-4xl font-bold text-green-500">{newsworthyScore}</p>
              <p className="text-sm text-green-500">Newsworthy</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 text-xs"
          >
            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
              i
            </span>
            Adjust scoring criteria
          </Button>
        </div>
        
        {/* Tab buttons - Updated to use smaller size and better layout */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "sponsors" ? "default" : "outline"}
            size="sm"
            className={`${activeTab === "sponsors" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""} px-2`}
            onClick={() => setActiveTab("sponsors")}
          >
            <Users className="h-3 w-3 mr-1" />
            Sponsors
          </Button>
          <Button
            variant={activeTab === "passPercent" ? "default" : "outline"}
            size="sm"
            className={`${activeTab === "passPercent" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""} px-2`}
            onClick={() => setActiveTab("passPercent")}
          >
            <Percent className="h-3 w-3 mr-1" />
            Pass %
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            size="sm"
            className={`${activeTab === "history" ? "bg-[#35B7CD] hover:bg-[#2A9BB0]" : ""} px-2`}
            onClick={() => setActiveTab("history")}
          >
            <History className="h-3 w-3 mr-1" />
            History
          </Button>
        </div>
        
        {/* Content based on active tab */}
        <div className="pt-2">
          {activeTab === "sponsors" && (
            <div className="space-y-4">
              <BillSponsors bill={bill} />
            </div>
          )}
          
          {activeTab === "passPercent" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium text-green-600 mb-2">Very Likely To Pass</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">↗</span> 
                    Assigned to Rules Committee
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">↗</span> 
                    Bipartisan sponsorship
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">↗</span> 
                    Noted stakeholders
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="text-red-500 mr-2">↘</span> 
                    Late for introduction deadline
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === "history" && (
            <div className="space-y-4">
              <BillHistoryView bill={bill} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyInsightsCard;
