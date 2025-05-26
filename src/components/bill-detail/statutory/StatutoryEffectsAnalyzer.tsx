
import { useState, useEffect } from "react";
import { Bill } from "@/types";
import { detectStatutoryAmendments, extractAmendments, StatutoryAmendment } from "@/services/statutoryAnalysis";
import AmendmentsIndex from "./AmendmentsIndex";
import StatutoryDiffDisplay from "./StatutoryDiffDisplay";

interface StatutoryEffectsAnalyzerProps {
  bill: Bill;
}

const StatutoryEffectsAnalyzer = ({ bill }: StatutoryEffectsAnalyzerProps) => {
  const [amendments, setAmendments] = useState<StatutoryAmendment[]>([]);
  const [selectedAmendment, setSelectedAmendment] = useState<string | null>(null);
  const [hasAmendments, setHasAmendments] = useState<boolean>(false);

  useEffect(() => {
    const analyzeBill = () => {
      // Get bill text from various possible sources
      const billText = bill.text || 
        (bill.data?.text) || 
        (bill.versions && bill.versions.length > 0 ? 
          bill.versions[0].sections[0]?.content : "") || "";

      if (!billText) {
        setHasAmendments(false);
        setAmendments([]);
        return;
      }

      // Check if bill amends statutes
      const hasStatutoryAmendments = detectStatutoryAmendments(billText);
      setHasAmendments(hasStatutoryAmendments);

      if (hasStatutoryAmendments) {
        // Extract amendment details
        const extractedAmendments = extractAmendments(billText);
        setAmendments(extractedAmendments);
        
        // Auto-select first amendment if available
        if (extractedAmendments.length > 0) {
          setSelectedAmendment(extractedAmendments[0].id);
        }
      } else {
        setAmendments([]);
        setSelectedAmendment(null);
      }
    };

    analyzeBill();
  }, [bill]);

  const selectedAmendmentData = amendments.find(a => a.id === selectedAmendment) || null;

  if (!hasAmendments) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">
          This bill does not amend existing statutes.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Found {amendments.length} statutory amendment{amendments.length !== 1 ? 's' : ''}
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Amendments Index */}
          <div className="lg:col-span-1">
            <AmendmentsIndex
              amendments={amendments}
              selectedAmendment={selectedAmendment}
              onSelectAmendment={setSelectedAmendment}
            />
          </div>
          
          {/* Diff Display */}
          <div className="lg:col-span-2">
            <StatutoryDiffDisplay amendment={selectedAmendmentData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatutoryEffectsAnalyzer;
