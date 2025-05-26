
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
  const [lastAnalyzedText, setLastAnalyzedText] = useState<string>("");

  // Function to get bill text from various sources
  const getBillText = (): string => {
    let billText = "";
    
    if (bill.text && bill.text.trim().length > 0) {
      billText = bill.text;
      console.log('Using bill.text');
    } else if (bill.data?.text && bill.data.text.trim().length > 0) {
      billText = bill.data.text;
      console.log('Using bill.data.text');
    } else if (bill.versions && bill.versions.length > 0) {
      const versionWithContent = bill.versions.find(v => 
        v.sections && v.sections.length > 0 && v.sections[0].content
      );
      if (versionWithContent) {
        billText = versionWithContent.sections[0].content;
        console.log('Using bill.versions content');
      }
    }

    // Try to get text from localStorage cache as fallback
    if (!billText || billText.trim().length === 0) {
      try {
        const cachedText = localStorage.getItem(`bill_text_${bill.id}`);
        if (cachedText) {
          const parsedCache = JSON.parse(cachedText);
          if (parsedCache.text) {
            billText = parsedCache.text;
            console.log('Using cached bill text from localStorage');
          }
        }
      } catch (error) {
        console.warn('Error reading cached bill text:', error);
      }
    }

    return billText;
  };

  const analyzeBill = (billText: string) => {
    console.log('Analyzing bill text for statutory amendments...');
    console.log('Bill text length:', billText.length);
    console.log('First 200 chars:', billText.substring(0, 200));

    if (!billText || billText.trim().length === 0) {
      console.log('No bill text available for statutory analysis');
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

  // Effect to analyze bill text when it becomes available or changes
  useEffect(() => {
    const currentBillText = getBillText();
    
    // Only analyze if we have text and it's different from what we last analyzed
    if (currentBillText && currentBillText !== lastAnalyzedText) {
      console.log('Bill text changed, reanalyzing...');
      analyzeBill(currentBillText);
      setLastAnalyzedText(currentBillText);
    } else if (!currentBillText) {
      console.log('No bill text available yet, waiting...');
      setHasAmendments(false);
      setAmendments([]);
    }
  }, [bill, bill.text, bill.data?.text, lastAnalyzedText]);

  // Effect to periodically check for cached text updates
  useEffect(() => {
    const checkForTextUpdates = () => {
      const currentBillText = getBillText();
      if (currentBillText && currentBillText !== lastAnalyzedText) {
        console.log('Found new bill text in cache, reanalyzing...');
        analyzeBill(currentBillText);
        setLastAnalyzedText(currentBillText);
      }
    };

    // Check every 2 seconds for text updates
    const interval = setInterval(checkForTextUpdates, 2000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [lastAnalyzedText]);

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
