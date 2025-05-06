
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface BillTextLoadingProps {
  isLoading: boolean;
  onFetchText: () => void;
  errorMessage?: string | null;
}

const BillTextLoading = ({ isLoading, onFetchText, errorMessage }: BillTextLoadingProps) => {
  return (
    <>
      {isLoading ? (
        <div className="flex items-center">
          <Spinner className="mr-2 h-4 w-4" />
          <span className="text-sm text-gray-500">Loading bill text...</span>
        </div>
      ) : (
        <div>
          <Button
            onClick={onFetchText}
            disabled={isLoading}
            size="sm"
            className="mt-2"
          >
            {isLoading ? "Loading..." : errorMessage ? "Retry Loading Text" : "Load Bill Text"}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            Click to fetch the bill text from LegiScan
          </p>
        </div>
      )}
    </>
  );
};

export default BillTextLoading;
