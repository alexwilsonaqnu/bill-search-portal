
import React from "react";
import { format } from "date-fns";
import SearchBar from "@/components/SearchBar";
import { Spinner } from "@/components/ui/spinner";

interface HeaderSectionProps {
  query: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const HeaderSection = ({ query, onSearch, isLoading = false }: HeaderSectionProps) => {
  console.log("HeaderSection rendering with query:", query, "isLoading:", isLoading);
  
  return (
    <div className="text-center mb-8 md:mb-16">
      <div className="hidden md:block absolute top-20 left-6 text-gray-500 text-sm">
        {format(new Date(), "MMMM d, yyyy")}
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold mb-8 billinois-logo text-brand-primary">
        Billinois
      </h1>
      
      <div className="mx-auto max-w-xl">
        {/* SearchBar with debugging props */}
        <SearchBar 
          initialQuery={query} 
          onSearch={(searchQuery) => {
            console.log("HeaderSection: onSearch called with:", searchQuery);
            onSearch(searchQuery);
          }}
          isLoading={isLoading}
        />
      </div>
      
      {isLoading && (
        <div className="flex justify-center mt-6">
          <Spinner size="md" color="primary" />
          <span className="ml-3 text-gray-500">Searching bills...</span>
        </div>
      )}
    </div>
  );
};

export default HeaderSection;
