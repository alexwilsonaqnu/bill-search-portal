
import React from "react";
import BillCard from "@/components/BillCard";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Bill } from "@/types";

interface BillsListProps {
  isLoading: boolean;
  billsToShow: Bill[] | null;
  data?: {
    bills: Bill[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

const BillsList = ({
  isLoading,
  billsToShow,
  data,
  error,
  onRetry,
  onPageChange,
}: BillsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        {[1, 2, 3].map((i) => (
          <Skeleton 
            key={i} 
            className="h-40 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg mt-8">
        <p className="text-red-500 mb-4">Error searching for bills. Please try again.</p>
        <Button 
          onClick={onRetry}
          variant="default"
          className="mx-auto"
        >
          Retry Search
        </Button>
      </div>
    );
  }

  if (!billsToShow || billsToShow.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4 mt-8">
        {billsToShow.map((bill, index) => (
          <BillCard 
            key={bill.id}
            bill={bill} 
            className="transition-all duration-300 hover:translate-x-1" 
            animationDelay={`${index * 100}ms`}
          />
        ))}
      </div>
      
      {data?.totalPages && data.totalPages > 1 && (
        <Pagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default BillsList;
