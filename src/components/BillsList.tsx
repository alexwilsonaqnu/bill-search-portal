
import React from "react";
import BillCard from "@/components/BillCard";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
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
          <div 
            key={i} 
            className="h-40 rounded-lg bg-gray-100 animate-pulse-light"
          />
        ))}
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
