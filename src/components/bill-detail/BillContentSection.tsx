
import { useState } from "react";
import { Bill } from "@/types";
import BillTextContent from "./BillTextContent";
import BillVersions from "./BillVersions";
import EmptyBillContent from "./EmptyBillContent";
import BillDataExtractor from "./BillDataExtractor";
import BillContentLoader from "./BillContentLoader";

interface BillContentSectionProps {
  bill: Bill;
}

const BillContentSection = ({ bill }: BillContentSectionProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  
  // Extract bill data
  const { 
    ilgaUrl, 
    billTextContent, 
    hasTextContent, 
    textFormat 
  } = BillDataExtractor({ bill });
  
  // Get content loader
  const { fetchExternalContent } = BillContentLoader({ 
    ilgaUrl, 
    setIsLoadingExternalContent,
    isLoadingExternalContent
  });
  
  return (
    <>
      {/* Content Display Logic */}
      {hasTextContent && (
        <BillTextContent textContent={billTextContent} textFormat={textFormat} />
      )}
      
      <BillVersions versions={bill.versions || []} />
      
      {/* No Content Notice */}
      {!hasTextContent && !bill.versions?.length && (
        <EmptyBillContent 
          bill={bill}
          ilgaUrl={ilgaUrl}
          isLoadingExternalContent={isLoadingExternalContent}
          fetchExternalContent={fetchExternalContent}
        />
      )}
    </>
  );
};

export default BillContentSection;
