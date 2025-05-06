
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
  return (
    <div className="text-center mb-8 md:mb-16">
      <div className="hidden md:block absolute top-20 left-6 text-gray-500 text-sm">
        {format(new Date(), "MMMM d, yyyy")}
      </div>
      
      {/* Logo removed from here to prevent duplication with navbar */}
      
      <div className="mx-auto max-w-xl">
        <SearchBar 
          initialQuery={query} 
          onSearch={onSearch} 
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
