
import { useState } from "react";
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import BillBasicInfo from "./BillBasicInfo";
import BillResourceLinks from "./BillResourceLinks";
import BillTextHash from "./BillTextHash";
import BillHistoryView from "./BillHistoryView";
import BillTextContent from "./BillTextContent";
import ExternalContent from "./ExternalContent";
import BillVersions from "./BillVersions";
import EmptyBillContent from "./EmptyBillContent";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  const [externalContent, setExternalContent] = useState<string | null>(null);
  
  // Function to extract the ILGA URL if present in the bill data
  const getIlgaUrl = () => {
    if (bill.data?.texts?.[0]?.state_link) {
      return bill.data.texts[0].state_link;
    }
    if (bill.data?.text_url) {
      return bill.data.text_url;
    }
    // Look for a URL pattern in any field
    const billString = JSON.stringify(bill.data);
    const urlMatch = billString.match(/https?:\/\/www\.ilga\.gov\/legislation\/\S+\.htm/);
    return urlMatch ? urlMatch[0] : null;
  };
  
  // Extract the ILGA URL
  const ilgaUrl = getIlgaUrl();
  
  // Check if bill has text content - look in multiple possible locations
  const getTextContent = () => {
    // Direct text_content field
    if (bill.data?.text_content) return bill.data.text_content;
    
    // Check in texts array
    if (bill.data?.texts && Array.isArray(bill.data.texts)) {
      const textWithContent = bill.data.texts.find(t => t.content);
      if (textWithContent) return textWithContent.content;
    }
    
    // Check in text field
    if (bill.data?.text) return bill.data.text;
    
    // Check in full_text field
    if (bill.data?.full_text) return bill.data.full_text;
    
    return null;
  };
  
  const billTextContent = getTextContent();
  const hasTextContent = !!billTextContent;
  
  // Extract the text hash from bill data
  const textHash = bill.data?.text_hash || "";
  
  // Determine text format (html or plain text)
  const getTextFormat = () => {
    if (bill.data?.text_format) return bill.data.text_format;
    
    // Try to auto-detect format
    if (billTextContent && typeof billTextContent === 'string') {
      if (billTextContent.trim().startsWith('<') && billTextContent.includes('</')) {
        return 'html';
      }
    }
    
    return 'text';
  };
  
  const textFormat = getTextFormat();
  
  // Function to fetch the content from ILGA website
  const fetchExternalContent = async () => {
    if (!ilgaUrl) {
      toast.error("No external URL found for this bill");
      return;
    }
    
    setIsLoadingExternalContent(true);
    toast.info("Fetching bill text from ILGA website...");
    
    try {
      // We need to use a proxy to bypass CORS restrictions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-content?url=${encodeURIComponent(ilgaUrl)}`);
      
      if (response.ok) {
        const text = await response.text();
        setExternalContent(text);
        toast.success("Successfully loaded bill text");
      } else {
        console.error("Failed to fetch content:", response.statusText);
        toast.error(`Failed to load content: ${response.statusText}`);
        setExternalContent(`Failed to load content from ${ilgaUrl}`);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error(`Error fetching content: ${error instanceof Error ? error.message : String(error)}`);
      setExternalContent(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingExternalContent(false);
    }
  };
  
  console.log("Bill data:", {
    hasTextContent,
    textFormat,
    billTextAvailable: !!billTextContent,
    billDataKeys: bill.data ? Object.keys(bill.data) : [],
    externalUrl: ilgaUrl,
    textHash
  });
  
  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Bill Overview</h2>
        
        <div className="space-y-6">
          <BillBasicInfo bill={bill} />
          
          <BillResourceLinks 
            ilgaUrl={ilgaUrl} 
            isLoadingExternalContent={isLoadingExternalContent}
            fetchExternalContent={fetchExternalContent}
          />
          
          <BillTextHash textHash={textHash} />
          
          <BillHistoryView changes={bill.changes} />
        </div>
      </Card>
      
      {/* Content Display Logic */}
      {hasTextContent && (
        <BillTextContent textContent={billTextContent} textFormat={textFormat} />
      )}
      
      {externalContent && !hasTextContent && (
        <ExternalContent content={externalContent} />
      )}
      
      <BillVersions versions={bill.versions || []} />
      
      {/* No Content Notice */}
      {!hasTextContent && !externalContent && !bill.versions?.length && (
        <EmptyBillContent 
          ilgaUrl={ilgaUrl}
          isLoadingExternalContent={isLoadingExternalContent}
          fetchExternalContent={fetchExternalContent}
        />
      )}
    </div>
  );
};

export default BillOverview;
