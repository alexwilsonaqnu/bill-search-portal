
import { useState, FormEvent, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
  const formRef = useRef<HTMLFormElement>(null);
  
  // Update local state when initialQuery prop changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Log when the component renders with props
  useEffect(() => {
    console.log("SearchBar rendered with:", { 
      initialQuery, 
      hasOnSearch: !!onSearch, 
      isLoading 
    });
  }, [initialQuery, onSearch, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    // Prevent default form submission to avoid page reload
    e.preventDefault();
    e.stopPropagation(); // Also stop propagation to prevent any parent handlers
    
    console.log("Form submitted, preventing default behavior");
    
    if (!query.trim() || isLoading) {
      console.log("Empty query or loading, skipping search");
      return;
    }
    
    if (onSearch) {
      console.log("Using onSearch handler with query:", query);
      // Use setTimeout to ensure the preventDefault has completed
      setTimeout(() => {
        onSearch(query);
        // Focus the input after search for better UX
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 0);
    } else {
      console.log("No onSearch handler, navigating with query:", query);
      // If no onSearch handler provided, navigate to search results
      // Use replace: true to prevent adding to navigation history
      navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    }
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit}
      className={`search-bar flex items-center bg-white shadow-sm rounded-md px-4 py-2 w-full max-w-xl mx-auto ${className}`}
    >
      {/* Using regular HTML input instead of custom Input component */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by topic (such as taxes or education) by bill name or by sponsor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow border-0 outline-none px-2 w-full bg-transparent"
        disabled={isLoading}
        aria-label="Search bills"
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost"
        className="text-gray-500 hover:text-brand-primary hover:bg-transparent"
        disabled={isLoading || !query.trim()}
        onClick={(e) => {
          // Backup click handler that also prevents form submission
          if (!formRef.current) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
          }
        }}
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
