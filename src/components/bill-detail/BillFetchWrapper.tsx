
import { useParams } from "react-router-dom";
import { useBillData } from "@/hooks/useBillData";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { normalizeBillId } from "@/utils/billTransformUtils";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  // Normalize the ID from the URL to ensure consistent lookup
  const normalizedId = id ? normalizeBillId(id) : "";
  console.log(`Fetching bill with ID from URL: ${id}, normalized to: ${normalizedId}`);
  
  // Pass the normalized ID to the hook for fetching
  const { bill, isLoading, isError } = useBillData({ id: normalizedId });

  if (isLoading) {
    return <BillDetailLoading />;
  }

  if (isError || !bill) {
    return <BillDetailError id={normalizedId || id || ""} />;
  }

  // Enhanced logging for debugging bill ID issues
  console.log("Bill data in BillFetchWrapper:", {
    id: bill.id,
    dataKeys: bill.data ? Object.keys(bill.data) : [],
    // Check if bill.data.bill exists (nested structure)
    nestedBill: bill.data?.bill ? true : false,
    billId: bill.data?.bill?.bill_id || bill.data?.bill_id,
    docId: bill.data?.bill?.texts?.[0]?.doc_id || bill.data?.texts?.[0]?.doc_id,
    requestedId: id
  });

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
