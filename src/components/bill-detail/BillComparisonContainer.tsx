import { useState } from "react";
import { Bill } from "@/types";
import VersionComparison from "@/components/VersionComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BillComparisonContainerProps {
  bill: Bill;
}

const BillComparisonContainer = ({ bill }: BillComparisonContainerProps) => {
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  
  // Limit versions to improve performance and prevent browser crashes
  // Updated: Increased from 5 to 10 versions
  const safeVersions = bill.versions ? 
    // Only use the first 10 versions to prevent performance issues
    bill.versions.slice(0, 10) : 
    [];
  
  // Add a warning if we're limiting versions
  const hasLimitedVersions = bill.versions && bill.versions.length > 10;

  const generateSummary = async () => {
    if (!safeVersions || safeVersions.length < 2) {
      toast.error("At least two versions are needed to generate a summary of changes");
      return;
    }

    setSummarizing(true);
    setSummaryError(null);
    setShowFallbackMessage(false);
    
    try {
      // Get the first two versions to compare (typically the original and first amendment)
      const originalVersion = safeVersions[0];
      const amendedVersion = safeVersions[1];

      // Calculate text sizes for better logging and error handling
      const originalTextLength = originalVersion.sections.reduce((sum, s) => sum + (s.content?.length || 0), 0);
      const amendedTextLength = amendedVersion.sections.reduce((sum, s) => sum + (s.content?.length || 0), 0);
      const totalTextLength = originalTextLength + amendedTextLength;
      
      console.log(`Comparing bill versions - Original: ${originalTextLength} chars, Amended: ${amendedTextLength} chars, Total: ${totalTextLength} chars`);
      
      // Format the bill versions into readable text for the API, filtering out empty content
      const originalText = originalVersion.sections
        .filter(s => s.content?.trim())
        .map(s => `${s.title}: ${s.content}`)
        .join('\n\n');
      
      const amendedText = amendedVersion.sections
        .filter(s => s.content?.trim())
        .map(s => `${s.title}: ${s.content}`)
        .join('\n\n');

      // Call the Edge Function to get a summary of the differences
      const { data, error } = await supabase.functions.invoke('summarize-bill-changes', {
        body: {
          originalTitle: originalVersion.name,
          amendedTitle: amendedVersion.name,
          originalText,
          amendedText,
          billId: bill.id,
          billTitle: bill.title
        }
      });

      if (error) {
        console.error("Error invoking function:", error);
        throw new Error(`Error invoking function: ${error.message}`);
      }

      if (data.error) {
        console.error("Function returned error:", data.error);
        throw new Error(data.error);
      }

      setSummary(data.summary);
      setShowFallbackMessage(false);
    } catch (error) {
      console.error("Error generating summary:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = "Unable to generate a detailed summary at this time.";
      
      // Check if it's a timeout/CPU error or other issue
      if (errorMessage.includes("exceeded") || 
          errorMessage.includes("timeout") || 
          errorMessage.includes("time limit") ||
          errorMessage.includes("CPU") ||
          errorMessage.includes("large")) {
        // It's likely a size/timeout issue
        setShowFallbackMessage(true);
        userFriendlyMessage += " The bill text is too large for our automatic comparison tool.";
      } else {
        // Other error
        userFriendlyMessage += " Please try again later.";
      }
      
      // Set a user-friendly error message
      setSummaryError(userFriendlyMessage);
      toast.error(`Summary generation failed: ${errorMessage}`);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Version Comparison</h2>

      {hasLimitedVersions && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
          <strong>Performance Notice:</strong> Only showing the first 10 versions to prevent browser performance issues.
          This bill has {bill.versions?.length} versions total.
        </div>
      )}

      {safeVersions && safeVersions.length > 1 ? (
        <>
          {/* Summary Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-brand-primary">Changes Summary</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={generateSummary}
                disabled={summarizing}
                className="flex items-center gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${summarizing ? 'animate-spin' : ''}`} />
                {summarizing ? "Analyzing..." : "Generate Summary"}
              </Button>
            </div>
            
            {summarizing ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[85%]" />
              </div>
            ) : summaryError ? (
              <>
                <div className="text-sm bg-red-50 border border-red-200 rounded p-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{summaryError}</p>
                </div>
                
                {showFallbackMessage && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-1 inline" /> Alternative Approach
                    </h4>
                    <p className="text-sm text-blue-700">
                      This bill has extensive text that exceeds our automated comparison limits. 
                      Please use the visual comparison tools below to manually review changes between versions.
                      The "Side by Side" view may be more effective for comparing large sections.
                    </p>
                  </div>
                )}
              </>
            ) : summary ? (
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {summary}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Click "Generate Summary" to create an AI-powered analysis of the changes between versions.
              </p>
            )}
          </div>
          
          {/* Versions Comparison Section */}
          <Tabs defaultValue="visual-diff" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="visual-diff" className="flex-1">Visual Diff</TabsTrigger>
              <TabsTrigger value="side-by-side" className="flex-1">Side by Side</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visual-diff" className="mt-0">
              <VersionComparison versions={safeVersions} displayMode="visual-diff" />
            </TabsContent>
            
            <TabsContent value="side-by-side" className="mt-0">
              <VersionComparison versions={safeVersions} displayMode="side-by-side" />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <p className="text-gray-500">This bill only has one version. Comparison is not available.</p>
      )}
    </div>
  );
};

export default BillComparisonContainer;
