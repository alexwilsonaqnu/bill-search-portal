
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
    console.log(`URL contains a numeric ID: ${id}. Will try multiple formats.`);
  }
  
  // Pass the ID directly to the hook
  const { bill, isLoading, isError } = useBillData({ id });

  if (isLoading) {
    return <BillDetailLoading />;
  }

  if (isError || !bill) {
    return <BillDetailError id={id || ""} />;
  }

  // Enhanced logging for debugging bill ID issues
  console.log("Bill data in BillFetchWrapper:", {
    id: bill.id,
    requestedId: id,
    dataKeys: bill.data ? Object.keys(bill.data) : [],
    nestedBill: bill.data?.bill ? true : false,
    billId: bill.data?.bill?.bill_id || bill.data?.bill_id
  });

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
