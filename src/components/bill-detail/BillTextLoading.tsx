
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface BillTextLoadingProps {
  isLoading: boolean;
  onFetchText: () => void;
}

const BillTextLoading = ({ isLoading, onFetchText }: BillTextLoadingProps) => {
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
            {isLoading ? "Loading..." : "Load Bill Text"}
          </Button>
        </div>
      )}
    </>
  );
};

export default BillTextLoading;
