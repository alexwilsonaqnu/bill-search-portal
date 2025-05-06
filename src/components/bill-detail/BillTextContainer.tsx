
import { useEffect, useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillTextHash from "./BillTextHash";
import BillTextContent from "./BillTextContent";
import BillTextUploader from "./BillTextUploader";
import { fetchBillText } from "@/services/billTextService";
import { toast } from "sonner";

interface BillTextContainerProps {
  bill: Bill;
}

const BillTextContainer = ({ bill }: BillTextContainerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  
  const billId = bill.id;
  const textHash = bill.data?.text_hash || bill.data?.bill?.text_hash || null;
  const externalUrl = bill.data?.text_url || bill.data?.bill?.text_url || null;
  
  useEffect(() => {
    // Check if bill has text content
    const hasText = bill.text && bill.text.trim().length > 0;
    const hasTextHash = !!textHash;
    const hasVersions = bill.versions && bill.versions.length > 0 && 
                        bill.versions[0].sections && 
                        bill.versions[0].sections.length > 0 &&
                        bill.versions[0].sections[0].content;
    
    const isTextEmpty = !hasText && !hasVersions && !hasTextHash;
    setIsEmpty(isTextEmpty);
    
    // Auto-fetch bill text if it has a text hash but no content yet
    if (hasTextHash && !hasText && !hasVersions && !textContent && !isLoading) {
      console.log(`Auto-fetching bill text for bill ${billId} using text_hash: ${textHash}`);
      fetchBillTextFromApi();
    }
  }, [bill, textHash, billId, textContent]);

  // Function to fetch bill text from Legiscan API
  const fetchBillTextFromApi = async () => {
    if (!billId || isLoading) return;
    
    setIsLoading(true);
    try {
      console.log(`Fetching bill text from API for bill ID: ${billId}`);
      const result = await fetchBillText(billId);
      
      if (result && result.text) {
        setTextContent(result.text);
        setIsEmpty(false);
        console.log(`Successfully fetched text for bill ${billId}`);
      } else {
        console.log(`No text content returned for bill ${billId}`);
        toast.error("Could not retrieve bill text.");
      }
    } catch (error) {
      console.error("Error fetching bill text:", error);
      toast.error(`Failed to fetch bill text: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Bill Text</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty && !isLoading ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              No bill text content available. You can upload bill text or view it from an external source.
            </p>
            <BillTextUploader billId={billId} onUploadComplete={(content) => {
              setTextContent(content);
              setIsEmpty(false);
            }} />
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading bill text...</p>
          </div>
        ) : (
          <>
            {textHash ? (
              <BillTextHash 
                textHash={textHash} 
                billId={billId} 
                externalUrl={externalUrl}
                providedText={textContent} 
              />
            ) : (
              <BillTextContent 
                bill={bill}
                externalUrl={externalUrl}
                additionalText={textContent}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillTextContainer;
