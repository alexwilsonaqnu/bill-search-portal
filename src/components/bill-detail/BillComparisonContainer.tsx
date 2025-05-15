
import { useState, useEffect } from "react";
import { Bill } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import BillDataExtractor from "./BillDataExtractor";
import VersionsManager from "./comparison/VersionsManager";
import SummarySection from "./comparison/SummarySection";
import ComparisonSection from "./comparison/ComparisonSection";
import VersionHeader from "./comparison/VersionHeader";
import LoadingState from "./comparison/LoadingState";

interface BillComparisonContainerProps {
  bill: Bill;
}

const BillComparisonContainer = ({ bill }: BillComparisonContainerProps) => {
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [versions, setVersions] = useState(bill.versions || []);
  const [versionsLoaded, setVersionsLoaded] = useState(false);
  
  // Extract bill state and number for API calls
  const { state, billNumber, legiscanBillId } = BillDataExtractor({ bill });
  
  // Limit versions to improve performance and prevent browser crashes
  // Updated: Increased from 5 to 10 versions
  const safeVersions = versions ? 
    // Only use the first 10 versions to prevent performance issues
    versions.slice(0, 10) : 
    [];
  
  // Add a warning if we're limiting versions
  const hasLimitedVersions = versions && versions.length > 10;
  
  // Proxy refreshVersions to our sub-component
  const refreshVersions = async () => {
    if (!legiscanBillId) return;
    
    setIsLoadingVersions(true);
    try {
      await new Promise(resolve => {
        const versionsManager = document.querySelector('[data-versions-manager]');
        if (versionsManager) {
          // @ts-ignore - this is a hack to trigger the refresh function
          versionsManager.refreshVersions?.();
        }
        setTimeout(resolve, 100); // Just in case nothing happens
      });
    } finally {
      setIsLoadingVersions(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Version Comparison</h2>
      
      <div className="flex justify-between items-center mb-4">
        <VersionHeader 
          versionsLoaded={versionsLoaded}
          versions={versions}
          safeVersions={safeVersions}
          hasLimitedVersions={hasLimitedVersions}
        />
        
        <VersionsManager
          bill={bill}
          legiscanBillId={legiscanBillId}
          state={state}
          setVersions={setVersions}
          setVersionsLoaded={setVersionsLoaded}
          data-versions-manager
        />
      </div>

      {isLoadingVersions ? (
        <LoadingState />
      ) : safeVersions && safeVersions.length > 1 ? (
        <>
          {/* Summary Section */}
          <SummarySection
            bill={bill}
            safeVersions={safeVersions}
            validationMessages={validationMessages}
          />
          
          {/* Versions Comparison Section */}
          <ComparisonSection
            safeVersions={safeVersions}
            refreshVersions={refreshVersions}
          />
        </>
      ) : (
        <ComparisonSection
          safeVersions={safeVersions}
          refreshVersions={refreshVersions}
        />
      )}
    </div>
  );
};

export default BillComparisonContainer;
