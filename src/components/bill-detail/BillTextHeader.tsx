
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";

interface BillTextHeaderProps {
  hasTextContent: boolean;
  toggleFullScreen: () => void;
  isLoading: boolean;
}

const BillTextHeader = ({ hasTextContent, toggleFullScreen, isLoading }: BillTextHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Bill Text</h3>
      {hasTextContent && !isLoading && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleFullScreen}
          className="flex items-center gap-1"
        >
          <Maximize className="h-4 w-4" /> Full Screen
        </Button>
      )}
    </div>
  );
};

export default BillTextHeader;
