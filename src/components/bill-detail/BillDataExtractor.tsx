
import { Bill } from "@/types";

interface BillDataExtractorProps {
  bill: Bill;
}

const BillDataExtractor = ({ bill }: BillDataExtractorProps) => {
  // Extract bill data from bill.data
  const billData = bill?.data?.bill || bill?.data;
  const state = bill?.state || 'IL';
  
  // Extract ILGA URL 
  const ilgaUrl = billData?.state_link || null;
  
  // Extract LegiScan ID
  const legiscanBillId = billData?.bill_id || bill?.id || null;
  
  // Extract bill number (format like "HB1234")
  const billNumber = billData?.bill_number || null;
  
  // Extract document hash
  const textHash = billData?.change_hash || '';
  
  // Extract sponsor information
  const sponsorInfo = billData?.sponsors?.[0] || bill?.sponsor || null;
  
  return {
    ilgaUrl,
    textHash,
    legiscanBillId,
    state,
    billNumber,
    sponsorInfo
  };
};

export default BillDataExtractor;
