
import { useParams } from "react-router-dom";
import { useBillData } from "@/hooks/useBillData";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { useEffect, useState } from "react";
import { Bill } from "@/types";
import { toast } from "sonner";

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
        // Try direct bill retrieval
        const storedBill = localStorage.getItem(`bill_${id}`);
        if (storedBill) {
          const parsedBill = JSON.parse(storedBill);
          console.log(`Found bill ${id} in localStorage`, {
            title: parsedBill.title?.substring(0, 30) + "..."
          });
          setLocalBill(parsedBill);
          return;
        }
        
        // Try mapping lookup
        const mappingsStr = localStorage.getItem('billIdMappings');
        if (mappingsStr) {
          const mappings = JSON.parse(mappingsStr);
          if (mappings[id]) {
            const alternateId = mappings[id];
            console.log(`Found alternate ID mapping: ${id} -> ${alternateId}`);
            
            // Try to get bill with alternate ID
            const altStoredBill = localStorage.getItem(`bill_${alternateId}`);
            if (altStoredBill) {
              const parsedBill = JSON.parse(altStoredBill);
              console.log(`Found bill using alternate ID ${alternateId} in localStorage`);
              setLocalBill(parsedBill);
              return;
            }
          }
        }
        
        // Check the cache
        const cacheData = localStorage.getItem('billIdCache');
        if (cacheData) {
          const billCache = JSON.parse(cacheData);
          if (billCache[id]) {
            console.log(`Found bill ${id} in billIdCache, but no full data available`);
          }
        }
      } catch (e) {
        console.warn("Error retrieving bill from localStorage:", e);
      }
    }
  }, [id]);
  
  // Pass the ID directly to the hook
  const { bill, isLoading, isError } = useBillData({ id });

  // Enhanced logging for debugging bill ID issues
  if (!isLoading) {
    if (bill) {
      console.log("Bill data loaded successfully from API:", {
        urlId: id,
        billId: bill.id,
        title: bill.title?.substring(0, 30) + "...",
        hasData: !!bill.data
      });
    } else {
      console.warn(`Bill not found with ID: ${id} from API`);
      
      if (localBill) {
        console.log("Using localStorage fallback for bill details");
        toast.info("Using cached version of bill data");
      }
    }
  }

  // If we're still loading from the API, show loading state
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
