
import React from "react";
import BillCard from "@/components/BillCard";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Bill } from "@/types";
import { CheckSquare, Database, Upload } from "lucide-react";

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

  if (billsToShow && billsToShow.length > 0) {
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

  // No bills found - show more detailed error and options
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          {error ? (
            <Database className="h-16 w-16 text-red-500" />
          ) : (
            <CheckSquare className="h-16 w-16 text-amber-500" />
          )}
        </div>
        
        <h3 className="text-xl font-medium mb-2">
          {error 
            ? "Unable to load bills from data source" 
            : "No bills found in the database or storage"
          }
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">
          {error 
            ? `There was an error loading the bills: ${error instanceof Error ? error.message : String(error)}`
            : "Try checking your Supabase storage buckets and database, or upload JSON bill files to get started."
          }
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry Loading Bills
          </Button>
          
          <Button 
            variant="outline"
            className="px-4 py-2 rounded flex items-center gap-2"
            onClick={() => window.scrollTo(0, 0)}
          >
            <Upload className="h-4 w-4" />
            Upload Bill Files
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillsList;
