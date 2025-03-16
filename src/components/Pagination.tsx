
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Truncate pages if there are too many
  let pagesToShow = pages;
  if (totalPages > 5) {
    if (currentPage <= 3) {
      pagesToShow = [...pages.slice(0, 3), 0, pages[pages.length - 1]];
    } else if (currentPage >= totalPages - 2) {
      pagesToShow = [pages[0], 0, ...pages.slice(totalPages - 3)];
    } else {
      pagesToShow = [pages[0], 0, currentPage, 0, pages[pages.length - 1]];
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>
      
      {pagesToShow.map((page, index) => 
        page === 0 ? (
          <span key={`ellipsis-${index}`} className="px-2">...</span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className={`h-8 w-8 ${currentPage === page ? 'bg-brand-primary hover:bg-brand-primary/90' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}
      
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  );
};

export default Pagination;
