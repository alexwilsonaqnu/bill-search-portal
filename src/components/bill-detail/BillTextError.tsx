
import { AlertCircle } from "lucide-react";

interface BillTextErrorProps {
  error: string | null;
}

const BillTextError = ({ error }: BillTextErrorProps) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-2">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
        <div>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            The Legiscan API subscription may have expired. Please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillTextError;
