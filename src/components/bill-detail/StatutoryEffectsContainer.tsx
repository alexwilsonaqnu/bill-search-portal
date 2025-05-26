
import { Card } from "@/components/ui/card";
import { Bill } from "@/types";
import { Scale } from "lucide-react";
import StatutoryEffectsAnalyzer from "./statutory/StatutoryEffectsAnalyzer";

interface StatutoryEffectsContainerProps {
  bill: Bill;
}

const StatutoryEffectsContainer = ({ bill }: StatutoryEffectsContainerProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Scale className="h-5 w-5 text-[#35B7CD] mr-2" />
        <h2 className="text-xl font-semibold">Statutory Effects</h2>
      </div>
      
      <StatutoryEffectsAnalyzer bill={bill} />
    </Card>
  );
};

export default StatutoryEffectsContainer;
