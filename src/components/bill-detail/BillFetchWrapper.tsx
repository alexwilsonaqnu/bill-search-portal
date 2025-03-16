
import { useParams } from "react-router-dom";
import { useBillData } from "@/hooks/useBillData";
import BillDetailView from "./BillDetailView";
import BillDetailLoading from "./BillDetailLoading";
import BillDetailError from "./BillDetailError";

const BillFetchWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { bill, isLoading, isError } = useBillData({ id });

  if (isLoading) {
    return <BillDetailLoading />;
  }

  if (isError || !bill) {
    return <BillDetailError id={id} />;
  }

  return <BillDetailView bill={bill} />;
};

export default BillFetchWrapper;
