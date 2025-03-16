
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
  };
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  fallbackBills: Bill[];
}

const BillsList = ({
  isLoading,
  billsToShow,
  data,
  error,
  onRetry,
  onPageChange,
  fallbackBills
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

  if (billsToShow) {
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
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center py-8">
        <h3 className="text-xl font-medium mb-2">No bills found from data source</h3>
        <p className="text-gray-500 mb-6">
          {error ? "There was an error loading the bills." : "Try uploading JSON files or adjust your search criteria"}
        </p>
        <div className="space-x-4">
          <Button 
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry Loading Bills
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillsList;
