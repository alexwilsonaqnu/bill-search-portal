
import { useParams } from "react-router-dom";
import { useBillData } from "@/hooks/useBillData";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { normalizeBillId } from "@/utils/billTransformUtils";
import { toast } from "sonner";
import { useEffect } from "react";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  // Normalize the ID from the URL to ensure consistent lookup
  const normalizedId = id ? normalizeBillId(id) : "";
  console.log(`Fetching bill with ID from URL: ${id}, normalized to: ${normalizedId}`);
  
  // Pass the normalized ID to the hook for fetching
  const { bill, isLoading, isError } = useBillData({ id: normalizedId });

  // Validate bill origin when it loads
  useEffect(() => {
    if (bill) {
      // Check state from links or data
      const stateLink = bill.data?.texts?.[0]?.state_link || bill.data?.text_url || "";
      const isWisconsinBill = stateLink.includes("legis.wisconsin.gov");
      const isIllinoisBill = stateLink.includes("ilga.gov");
      
      if (isWisconsinBill) {
        toast.warning("Warning: This appears to be a Wisconsin bill, not an Illinois bill", {
          duration: 8000,
          id: "wisconsin-bill-warning"
        });
      } else if (!isIllinoisBill && stateLink) {
        toast.warning("Warning: This bill may not be from Illinois", {
          duration: 6000,
          id: "non-illinois-bill-warning"
        });
      }
    }
  }, [bill]);

  if (isLoading) {
    return <BillDetailLoading />;
  }

  if (isError || !bill) {
    return <BillDetailError id={normalizedId || id || ""} />;
  }

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
