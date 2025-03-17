
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PdfNavigationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const PdfNavigation = ({ 
  currentPage, 
  totalPages, 
  onPreviousPage, 
  onNextPage 
}: PdfNavigationProps) => {
  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousPage}
        disabled={currentPage <= 1}
        className="mr-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm mx-2">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        className="ml-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PdfNavigation;
