
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface BillTextErrorProps {
  error: string | null;
  onRetry?: () => void;
}

const BillTextError = ({ error, onRetry }: BillTextErrorProps) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-2">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            The LegiScan API may be temporarily unavailable. Please try again later.
          </p>
          
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 bg-white hover:bg-red-50 border-red-200 text-red-600"
              onClick={onRetry}
            >
              <RefreshCcw className="h-3.5 w-3.5 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillTextError;
