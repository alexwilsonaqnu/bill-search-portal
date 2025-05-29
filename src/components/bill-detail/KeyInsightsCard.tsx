
import { useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Percent, Users, Loader2, CheckCircle } from "lucide-react";
import BillSponsors from "@/components/bill/BillSponsors";
import BillHistoryView from "./BillHistoryView";
import { useBillPassAnalysis } from "@/hooks/useBillPassAnalysis";
import { useBillNewsworthiness } from "@/hooks/useBillNewsworthiness";

interface KeyInsightsCardProps {
  bill: Bill;
}

type InsightTab = "sponsors" | "passPercent" | "history";

const KeyInsightsCard = ({ bill }: KeyInsightsCardProps) => {
  const [activeTab, setActiveTab] = useState<InsightTab>("sponsors");
  
  // Fetch pass chance analysis
  const { data: passAnalysis, isLoading: isAnalyzing } = useBillPassAnalysis({ 
    bill, 
    enabled: activeTab === "passPercent" 
  });
  
  // Fetch newsworthiness analysis (pass the pass chance score if available)
  const { data: newsworthinessAnalysis, isLoading: isAnalyzingNewsworthiness } = useBillNewsworthiness({ 
    bill,
    passChanceScore: passAnalysis?.score,
    enabled: true // Always load newsworthiness for the main display
  });

  // Calculate newsworthiness score to display
  const newsworthyScore = newsworthinessAnalysis?.score || 0;

  // Get pass chance description based on score
  const getPassChanceDescription = (score: number, hasPassed?: boolean) => {
    if (hasPassed) return "Bill Has Passed";
    if (score >= 5) return "Very Likely To Pass";
    if (score >= 4) return "Likely To Pass";
    if (score >= 3) return "Moderate Chance To Pass";
    if (score >= 2) return "Unlikely To Pass";
    return "Very Unlikely To Pass";
  };

  // Get pass chance color based on score
  const getPassChanceColor = (score: number, hasPassed?: boolean) => {
    if (hasPassed) return "text-green-700";
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    if (score >= 2) return "text-orange-600";
    return "text-red-600";
  };

  // Get newsworthiness color based on score
  const getNewsworthinessColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Newsworthy score section */}
        <div className="flex justify-center items-center">
          <div className="flex items-center">
            <div className="border border-green-300 rounded-md p-4 bg-white text-center relative">
              {isAnalyzingNewsworthiness && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                </div>
              )}
              <p className={`text-4xl font-bold ${getNewsworthinessColor(newsworthyScore)}`}>
                {newsworthyScore}
              </p>
              <p className={`text-sm ${getNewsworthinessColor(newsworthyScore)}`}>
                Newsworthy
              </p>
            </div>
          </div>
        </div>
        
        {/* Show newsworthiness reasoning if available */}
        {newsworthinessAnalysis && !isAnalyzingNewsworthiness && (
          <div className="text-center text-sm text-gray-600 px-4">
            {newsworthinessAnalysis.reasoning}
          </div>
        )}
        
        {/* Tab buttons */}
        <div className="flex justify-center gap-2">
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
              {isAnalyzing ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Analyzing pass chance...</span>
                </div>
              ) : passAnalysis ? (
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-center mb-2">
                    {passAnalysis.hasPassed && (
                      <CheckCircle className="h-6 w-6 text-green-700 mr-2" />
                    )}
                    <h3 className={`text-xl font-medium text-center ${getPassChanceColor(passAnalysis.score, passAnalysis.hasPassed)}`}>
                      {getPassChanceDescription(passAnalysis.score, passAnalysis.hasPassed)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{passAnalysis.reasoning}</p>
                  <ul className="space-y-2">
                    {passAnalysis.factors.map((factor, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <span className={`mr-2 ${
                          factor.impact === 'positive' ? 'text-green-500' : 
                          factor.impact === 'negative' ? 'text-red-500' : 
                          'text-gray-500'
                        }`}>
                          {factor.impact === 'positive' ? '↗' : factor.impact === 'negative' ? '↘' : '→'}
                        </span> 
                        {factor.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Analysis Unavailable</h3>
                  <p className="text-sm text-gray-500">Unable to analyze pass chance at this time.</p>
                </div>
              )}
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
