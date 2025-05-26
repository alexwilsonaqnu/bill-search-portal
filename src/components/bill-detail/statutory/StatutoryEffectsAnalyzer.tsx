
import { useState, useEffect } from "react";
import { Bill } from "@/types";
import { detectStatutoryAmendments, extractAmendments, StatutoryAmendment } from "@/services/statutoryAnalysis";
import AmendmentsIndex from "./AmendmentsIndex";
import StatutoryDiffDisplay from "./StatutoryDiffDisplay";
import { getCachedBillText } from "@/components/bill-detail/text/utils/billTextCache";

interface StatutoryEffectsAnalyzerProps {
  bill: Bill;
}

const StatutoryEffectsAnalyzer = ({ bill }: StatutoryEffectsAnalyzerProps) => {
  const [amendments, setAmendments] = useState<StatutoryAmendment[]>([]);
  const [selectedAmendment, setSelectedAmendment] = useState<string | null>(null);
  const [hasAmendments, setHasAmendments] = useState<boolean>(false);

  // Function to get bill text using the same cache system as other components
  const getBillText = (): string => {
    let billText = "";
    
    // First try bill.text property
    if (bill.text && bill.text.trim().length > 0) {
      billText = bill.text;
      console.log('Statutory analyzer: Using bill.text');
    } 
    // Then try bill.data.text
    else if (bill.data?.text && bill.data.text.trim().length > 0) {
      billText = bill.data.text;
      console.log('Statutory analyzer: Using bill.data.text');
    } 
    // Then try bill versions content
    else if (bill.versions && bill.versions.length > 0) {
      const versionWithContent = bill.versions.find(v => 
        v.sections && v.sections.length > 0 && v.sections[0].content
      );
      if (versionWithContent) {
        billText = versionWithContent.sections[0].content;
        console.log('Statutory analyzer: Using bill.versions content');
      }
    }

    // Finally, try to get text from the same cache system used by other components
    if (!billText || billText.trim().length === 0) {
      const state = bill.state || 'IL';
      const billNumber = bill.data?.bill_number || null;
      
      const cachedData = getCachedBillText(bill.id, state, billNumber);
      if (cachedData && cachedData.text) {
        billText = cachedData.text;
        console.log('Statutory analyzer: Using cached bill text from same cache system');
      }
    }

    return billText;
  };

  const analyzeBill = (billText: string) => {
    console.log('Statutory analyzer: Analyzing bill text for amendments...');
    console.log('Statutory analyzer: Bill text length:', billText.length);
    console.log('Statutory analyzer: First 200 chars:', billText.substring(0, 200));

    if (!billText || billText.trim().length === 0) {
      console.log('Statutory analyzer: No bill text available');
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

  // Effect to analyze bill text when component mounts or bill changes
  useEffect(() => {
    const currentBillText = getBillText();
    analyzeBill(currentBillText);
  }, [bill, bill.text, bill.data?.text]);

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
