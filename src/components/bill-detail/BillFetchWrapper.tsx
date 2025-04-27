import { useParams } from "react-router-dom";
import { useBillData } from "@/hooks/useBillData";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { useEffect, useState } from "react";
import { Bill } from "@/types";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const [localBill, setLocalBill] = useState<Bill | null>(null);
  
  console.log(`Fetching bill with ID from URL: ${id}`);
  
  // Enhanced logging to help debug ID-related issues
  const isNumericId = id && /^\d+$/.test(id);
  if (isNumericId) {
    console.log(`URL contains a numeric ID: ${id}. This might be a memorial resolution.`);
  }
  
  // Check if we can find this bill in localStorage as a fallback
  useEffect(() => {
    if (id) {
      try {
        const storedBill = localStorage.getItem(`bill_${id}`);
        if (storedBill) {
          const parsedBill = JSON.parse(storedBill);
          console.log(`Found bill ${id} in localStorage`);
          setLocalBill(parsedBill);
          return;
        }
      } catch (e) {
        console.warn("Error retrieving bill from localStorage:", e);
      }
    }
  }, [id]);
  
  // Pass the ID directly to the hook
  const { bill, isLoading, isError } = useBillData({ id });

  // If we're still loading from the API and don't have a local version, show loading
  if (isLoading && !localBill) {
    return <BillDetailLoading />;
  }

  // If API returned an error or no bill, but we have a local version, use that
  if ((isError || !bill) && localBill) {
    console.log("Rendering bill from localStorage instead of API");
    return <BillDetailView bill={localBill} />;
  }

  // If API returned an error or no bill and no local version, show error
  if (isError || (!bill && !localBill)) {
    return <BillDetailError id={id || ""} />;
  }

  // If we have a bill from the API, use that
  return <BillDetailView bill={bill || localBill!} />;
};

export default BillFetchWrapper;
