
import React from "react";
import { format } from "date-fns";
import SearchBar from "@/components/SearchBar";

interface HeaderSectionProps {
  query: string;
  onSearch: (query: string) => void;
}

const HeaderSection = ({ query, onSearch }: HeaderSectionProps) => {
  return (
    <div className="text-center mb-16">
      <div className="hidden md:block absolute top-20 left-6 text-gray-500 text-sm">
        {format(new Date(), "MMMM d, yyyy")}
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold mb-8">
        <span className="logo-bill">Bill</span>
        <span className="logo-inois">inois</span>
      </h1>
      
      <div className="mx-auto max-w-xl">
        <SearchBar initialQuery={query} onSearch={onSearch} />
      </div>
    </div>
  );
};

export default HeaderSection;
