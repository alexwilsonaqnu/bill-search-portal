
import { useEffect, useState } from "react";
import { Bill } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BillTextHash from "./BillTextHash";
import BillTextContent from "./BillTextContent";
import BillTextUploader from "./BillTextUploader";

interface BillTextContainerProps {
  bill: Bill;
}

const BillTextContainer = ({ bill }: BillTextContainerProps) => {
  const [isEmpty, setIsEmpty] = useState(true);
  
  useEffect(() => {
    // Check if bill has text content
    const hasText = bill.text && bill.text.trim().length > 0;
    const hasVersions = bill.versions && bill.versions.length > 0 && 
                        bill.versions[0].sections && 
                        bill.versions[0].sections.length > 0 &&
                        bill.versions[0].sections[0].content;
    
    setIsEmpty(!hasText && !hasVersions);
  }, [bill]);

  const billId = bill.id;
  const textHash = bill.data?.text_hash || null;
  const externalUrl = bill.data?.text_url || null;
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Bill Text</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              No bill text content available. You can upload bill text or view it from an external source.
            </p>
            <BillTextUploader billId={billId} />
          </div>
        ) : (
          <>
            {textHash ? (
              <BillTextHash 
                textHash={textHash} 
                billId={billId} 
                externalUrl={externalUrl} 
              />
            ) : (
              <BillTextContent 
                bill={bill}
                externalUrl={externalUrl}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillTextContainer;
