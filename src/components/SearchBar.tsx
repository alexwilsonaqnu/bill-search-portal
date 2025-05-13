
import { useState, FormEvent, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  className?: string;
  isLoading?: boolean;
}

const SearchBar = ({ initialQuery = "", onSearch, className = "", isLoading = false }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    if (onSearch) {
      onSearch(query);
      // Focus the input after search for better UX
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // If no onSearch handler provided, navigate to search results
      // Use replace: true to prevent adding to navigation history
      navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`search-bar flex items-center bg-white shadow-sm rounded-md px-4 py-2 w-full max-w-xl mx-auto ${className}`}
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search by topic (such as taxes or education) by bill name or by sponsor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow border-0 shadow-none focus-visible:ring-0 px-2"
        disabled={isLoading}
        aria-label="Search bills"
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost"
        className="text-gray-500 hover:text-brand-primary hover:bg-transparent"
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? (
          <Spinner size="sm" color="primary" />
        ) : (
          <Search size={20} />
        )}
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
};

export default SearchBar;
