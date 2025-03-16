
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBillById } from "@/services/billService";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";
import { normalizeBillId } from "@/utils/billTransformUtils";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  
  const normalizedId = id ? normalizeBillId(id) : "";
  
  const { data: bill, isLoading, error, isError } = useQuery({
    queryKey: ["bill", normalizedId],
    queryFn: () => fetchBillById(normalizedId),
    enabled: !!normalizedId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (error) {
    console.error("Bill fetch error:", error);
  }

  if (isLoading) {
    return <BillDetailLoading />;
  }

  if (isError || !bill) {
    return <BillDetailError id={id} />;
  }

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
