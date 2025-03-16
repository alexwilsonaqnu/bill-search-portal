
import React from "react";
import { format } from "date-fns";
import SearchBar from "@/components/SearchBar";

interface HeaderSectionProps {
  query: string;
  onSearch: (query: string) => void;
  showUploader: boolean;
  toggleUploader: () => void;
}

const HeaderSection = ({ query, onSearch, showUploader, toggleUploader }: HeaderSectionProps) => {
  return (
    <div className="text-center mb-16">
      <div className="hidden md:block absolute top-20 left-6 text-gray-500 text-sm">
        {format(new Date(), "MMMM d, yyyy")}
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold logo-text mb-8">Billinois</h1>
      
      <div className="mx-auto max-w-xl">
        <SearchBar initialQuery={query} onSearch={onSearch} />
      </div>

      <div className="mt-4">
        <button
          onClick={toggleUploader}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          {showUploader ? "Hide File Uploader" : "Upload Bill Files"}
        </button>
      </div>
    </div>
  );
};

export default HeaderSection;
