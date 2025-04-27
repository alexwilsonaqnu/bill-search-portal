
import React from "react";
import { format } from "date-fns";
import SearchBar from "@/components/SearchBar";
import DateRangeFilter from "@/components/DateRangeFilter";

interface HeaderSectionProps {
  query: string;
  onSearch: (query: string) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateChange: (start: Date | undefined, end: Date | undefined) => void;
}

const HeaderSection = ({ 
  query, 
  onSearch,
  startDate,
  endDate,
  onDateChange
}: HeaderSectionProps) => {
  return (
    <div className="text-center mb-16">
      <div className="hidden md:block absolute top-20 left-6 text-gray-500 text-sm">
        {format(new Date(), "MMMM d, yyyy")}
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold mb-8 billinois-logo">
        Billinois
      </h1>
      
      <div className="mx-auto max-w-xl space-y-4">
        <SearchBar initialQuery={query} onSearch={onSearch} />
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateChange={onDateChange}
        />
      </div>
    </div>
  );
};

export default HeaderSection;
