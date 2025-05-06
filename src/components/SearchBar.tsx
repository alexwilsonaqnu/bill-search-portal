
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const SearchBar = ({ initialQuery = "", onSearch, className = "" }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch(query);
    } else {
      // If no onSearch handler provided, navigate to search results
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`search-bar flex items-center bg-white px-4 py-2 w-full max-w-xl mx-auto ${className}`}
    >
      <Input
        type="text"
        placeholder="Search by topic (such as taxes or education) by bill name or by sponsor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow border-0 shadow-none focus-visible:ring-0 px-2"
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost"
        className="text-gray-500 hover:text-brand-primary hover:bg-transparent"
      >
        <Search size={20} />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
};

export default SearchBar;
