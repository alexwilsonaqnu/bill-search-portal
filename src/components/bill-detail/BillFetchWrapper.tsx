
import { useParams } from "react-router-dom";
import { useBillData } from "@/hooks/useBillData";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  console.log(`Fetching bill with ID from URL: ${id}`);
  
  // Enhanced logging to help debug ID-related issues
  const isNumericId = id && /^\d+$/.test(id);
  if (isNumericId) {
    console.log(`URL contains a numeric ID: ${id}. This might be a memorial resolution.`);
  }
  
  // Pass the ID directly to the hook
  const { bill, isLoading, isError } = useBillData({ id });

  // Enhanced logging for debugging bill ID issues
  if (!isLoading) {
    if (bill) {
      console.log("Bill data loaded successfully:", {
        urlId: id,
        billId: bill.id,
        title: bill.title?.substring(0, 30) + "...",
        hasData: !!bill.data
      });
    } else {
      console.warn(`Bill not found with ID: ${id}`);
    }
  }

  if (isLoading) {
    return <BillDetailLoading />;
  }

  if (isError || !bill) {
    return <BillDetailError id={id || ""} />;
  }

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
