import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, FileText, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bill, BillVersion } from "@/types";

interface SummarySectionProps {
  bill: Bill;
  safeVersions: BillVersion[];
  validationMessages: string[];
}

const SummarySection = ({ bill, safeVersions, validationMessages }: SummarySectionProps) => {
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  // Function to validate versions have content
  const validateVersionsHaveContent = (versions: any[]) => {
    if (!versions || versions.length < 2) {
      return { isValid: false, messages: ["At least two versions are needed for comparison"] };
    }

    const messages: string[] = [];
    let isValid = true;
    
    // Check first two versions (original and amended)
    const originalVersion = versions[0];
    const amendedVersion = versions[1];
    
    // Validate original version
    if (!originalVersion.sections || originalVersion.sections.length === 0) {
      messages.push("Original version has no sections");
      isValid = false;
    } else {
      const hasContent = originalVersion.sections.some(s => s.content?.trim());
      if (!hasContent) {
        messages.push("Original version sections have no content");
        isValid = false;
      }
    }
    
    // Validate amended version
    if (!amendedVersion.sections || amendedVersion.sections.length === 0) {
      messages.push("Amended version has no sections");
      isValid = false;
    } else {
      const hasContent = amendedVersion.sections.some(s => s.content?.trim());
      if (!hasContent) {
        messages.push("Amended version sections have no content");
        isValid = false;
      }
    }
    
    return { isValid, messages };
  };

  const generateSummary = async () => {
    if (!safeVersions || safeVersions.length < 2) {
      toast.error("At least two versions are needed to generate a summary of changes");
      return;
    }

    // Reset states
    setSummarizing(true);
    setSummaryError(null);
    setShowFallbackMessage(false);
    
    try {
      // Enhanced validation for versions
      const validationResult = validateVersionsHaveContent(safeVersions);
      if (!validationResult.isValid) {
        throw new Error("Validation failed: " + validationResult.messages.join(", "));
      }
      
      // Get the first two versions to compare (typically the original and first amendment)
      const originalVersion = safeVersions[0];
      const amendedVersion = safeVersions[1];

      // Calculate text sizes for better logging and error handling
      const originalTextLength = originalVersion.sections.reduce((sum, s) => sum + (s.content?.length || 0), 0);
      const amendedTextLength = amendedVersion.sections.reduce((sum, s) => sum + (s.content?.length || 0), 0);
      const totalTextLength = originalTextLength + amendedTextLength;
      
      console.log(`Comparing bill versions - Original: ${originalTextLength} chars, Amended: ${amendedTextLength} chars, Total: ${totalTextLength} chars`);
      
      if (originalTextLength === 0 || amendedTextLength === 0) {
        throw new Error(`One or both versions have no text content. Original: ${originalTextLength} chars, Amended: ${amendedTextLength} chars`);
      }
      
      // Format the bill versions into readable text for the API, filtering out empty content
      const originalText = originalVersion.sections
        .filter(s => s.content?.trim())
        .map(s => `${s.title}: ${s.content}`)
        .join('\n\n');
      
      const amendedText = amendedVersion.sections
        .filter(s => s.content?.trim())
        .map(s => `${s.title}: ${s.content}`)
        .join('\n\n');

      // Additional validation for section content
      if (!originalText || originalText.trim().length < 10) {
        throw new Error("Original bill text is empty or too short");
      }
      
      if (!amendedText || amendedText.trim().length < 10) {
        throw new Error("Amended bill text is empty or too short");
      }

      console.log(`Calling summarize-bill-changes function for bill ${bill.id}`);
      
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
        const statusCode = error.status || 'unknown';
        const errorMessage = error.message || 'Unknown error';
        throw new Error(`Error invoking function (${statusCode}): ${errorMessage}`);
      }

      if (data?.error) {
        console.error("Function returned error:", data.error);
        throw new Error(data.error);
      }
      
      // Check if we got a fallback summary due to OpenAI API issues
      if (data?.fallbackProvided) {
        console.log("Fallback summary provided due to API issues");
        setShowFallbackMessage(true);
        
        if (data?.isAuthError) {
          toast.warning("API authentication issue", {
            description: "Using simplified comparison due to API key issues."
          });
        } else {
          toast.info("Using simplified comparison", {
            description: "AI-powered analysis unavailable at the moment."
          });
        }
      }
      
      if (!data?.summary) {
        console.error("No summary returned from function:", data);
        throw new Error("No summary was returned from the function");
      }

      setSummary(data.summary);
      
      if (!data.fallbackProvided) {
        toast.success("Summary generated successfully");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = "Unable to generate a detailed summary at this time.";
      
      // Enhanced error categorization for better user messaging
      if (errorMessage.includes("Validation failed")) {
        userFriendlyMessage = "Bill content validation failed. " + errorMessage;
      } else if (errorMessage.includes("exceeded") || 
          errorMessage.includes("timeout") || 
          errorMessage.includes("time limit") ||
          errorMessage.includes("CPU") ||
          errorMessage.includes("large")) {
        // It's likely a size/timeout issue
        setShowFallbackMessage(true);
        userFriendlyMessage += " The bill text is too large for our automatic comparison tool.";
      } else if (errorMessage.includes("401") || 
                errorMessage.includes("403") || 
                errorMessage.includes("auth") || 
                errorMessage.includes("API key")) {
        // Authentication issue
        userFriendlyMessage += " Authentication error with our AI service. Please try again later.";
      } else if (errorMessage.includes("429")) {
        // Rate limit
        userFriendlyMessage += " Rate limit reached. Please try again in a few minutes.";
      } else if (errorMessage.includes("500") || 
                errorMessage.includes("502") || 
                errorMessage.includes("503")) {
        // Server error
        userFriendlyMessage += " Server error encountered. Our team has been notified.";
      } else if (errorMessage.includes("empty") || 
                errorMessage.includes("content") || 
                errorMessage.includes("no text")) {
        // Content issue
        userFriendlyMessage = "Bill versions appear to have missing content. Please try different versions.";
      } else {
        // Other error
        userFriendlyMessage += " Please try again later.";
      }
      
      // Set a user-friendly error message
      setSummaryError(userFriendlyMessage);
      toast.error(`Summary generation failed: ${userFriendlyMessage}`);
    } finally {
      setSummarizing(false);
    }
  };

  return (
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
      ) : validationMessages.length > 0 ? (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 mb-1">Content Validation Issues:</p>
            <ul className="list-disc pl-5 text-amber-700 space-y-1">
              {validationMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
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
  );
};

export default SummarySection;
