
import { Bill } from "@/types";

interface BillDataExtractorProps {
  bill: Bill;
}

const BillDataExtractor = ({ bill }: BillDataExtractorProps) => {
  // Extract bill data from bill.data
  const billData = bill?.data?.bill || bill?.data;
  
  // Extract state - Always ensure there's a default state (IL)
  const state = bill?.state || billData?.state || 'IL';
  
  // Extract bill number (format like "HB1234") - Critical for state+billNumber lookups
  const billNumber = billData?.bill_number || null;
  
  // Extract ILGA URL 
  const ilgaUrl = billData?.state_link || null;
  
  // Extract LegiScan ID
  const legiscanBillId = billData?.bill_id || bill?.id || null;
  
  // Extract document hash
  const textHash = billData?.change_hash || '';
  
  // Extract sponsor information
  const sponsorInfo = billData?.sponsors?.[0] || bill?.sponsor || null;
  
  // Log the extraction for debugging
  console.log(`Extracted bill data: state=${state}, billNumber=${billNumber}, id=${legiscanBillId}`);
  
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
