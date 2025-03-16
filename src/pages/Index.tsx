
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import BillCard from "@/components/BillCard";
import Pagination from "@/components/Pagination";
import { fetchBills } from "@/services/s3Service";
import { toast } from "sonner";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["bills", query, currentPage],
    queryFn: () => fetchBills(query, currentPage),
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load bills. Please try again later.");
    }
  }, [error]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ q: query, page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
        <div className="text-center mb-16">
          <div className="hidden md:block absolute top-20 left-6 text-gray-500 text-sm">
            {format(new Date(), "MMMM d, yyyy")}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold logo-text mb-8">Billinois</h1>
          
          <div className="mx-auto max-w-xl">
            <SearchBar initialQuery={query} onSearch={handleSearch} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-40 rounded-lg bg-gray-100 animate-pulse-light"
              />
            ))}
          </div>
        ) : data?.bills && data.bills.length > 0 ? (
          <>
            <div className="space-y-4 mt-8">
              {data.bills.map((bill, index) => (
                <BillCard 
                  key={bill.id}
                  bill={bill} 
                  className="transition-all duration-300 hover:translate-x-1" 
                  animationDelay={`${index * 100}ms`}
                />
              ))}
            </div>
            
            {data.totalPages > 1 && (
              <Pagination
                currentPage={data.currentPage}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No results found</h3>
            <p className="text-gray-500">
              Try adjusting your search or browse all bills
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
