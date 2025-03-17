
import { useState } from "react";
import { Bill } from "@/types";
import BillTextContent from "./BillTextContent";
import ExternalContent from "./ExternalContent";
import BillVersions from "./BillVersions";
import EmptyBillContent from "./EmptyBillContent";
import BillDataExtractor from "./BillDataExtractor";
import BillContentLoader from "./BillContentLoader";

interface BillContentSectionProps {
  bill: Bill;
}

const BillContentSection = ({ bill }: BillContentSectionProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  const [externalContent, setExternalContent] = useState<string | null>(null);
  
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
    setExternalContent, 
    setIsLoadingExternalContent,
    isLoadingExternalContent
  });
  
  return (
    <>
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
    </>
  );
};

export default BillContentSection;
