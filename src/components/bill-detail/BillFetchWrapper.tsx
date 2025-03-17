
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

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
