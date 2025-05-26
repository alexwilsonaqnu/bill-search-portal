
import { Card } from "@/components/ui/card";
import { Bill } from "@/types";
import { Scale } from "lucide-react";

interface StatutoryEffectsContainerProps {
  bill: Bill;
}

const StatutoryEffectsContainer = ({ bill }: StatutoryEffectsContainerProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center mb-4">
        <Scale className="h-5 w-5 text-[#35B7CD] mr-2" />
        <h2 className="text-xl font-semibold">Statutory Effects</h2>
      </div>
      
      <div className="text-center py-12">
        <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Statutory Effects Analysis
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          This feature will analyze how this bill affects existing statutes and regulations. 
          Analysis tools coming soon.
        </p>
      </div>
    </Card>
  );
};

export default StatutoryEffectsContainer;
