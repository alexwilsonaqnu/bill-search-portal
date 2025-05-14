
import { useEffect } from "react";
import BillFetchWrapper from "@/components/bill-detail/BillFetchWrapper";
import { useParams } from "react-router-dom";

const BillDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Add some debugging info
  useEffect(() => {
    console.log(`BillDetail page rendering for bill ID: ${id || 'undefined'}`);
  }, [id]);

  return (
    <div className="w-full">
      <BillFetchWrapper />
    </div>
  );
};

export default BillDetail;
