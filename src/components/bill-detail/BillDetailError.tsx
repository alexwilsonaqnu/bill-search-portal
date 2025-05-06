
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface BillDetailErrorProps {
  error: Error | null;
  onRetry: () => void;
  onGoBack: () => void;
  isApiDown?: boolean;
}

const BillDetailError = ({ error, onRetry, onGoBack, isApiDown = false }: BillDetailErrorProps) => {
  const errorMessage = error?.message || "Unknown error";
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Bill Details</h1>
        
        <Button variant="outline" size="sm" onClick={onGoBack} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search
        </Button>
      </div>
      
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        {isApiDown ? (
          <WifiOff className="h-5 w-5 text-red-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        )}
        
        <AlertTitle className="text-red-800 font-medium">
          {isApiDown ? "LegiScan API Unavailable" : "Failed to load bill"}
        </AlertTitle>
        
        <AlertDescription className="text-red-700 mt-2">
          {isApiDown ? (
            <div className="space-y-2">
              <p>We're currently experiencing issues connecting to the LegiScan bill information service.</p>
              <p>This is likely a temporary issue with the external API. Please try again later.</p>
            </div>
          ) : (
            <p>{errorMessage}</p>
          )}
        </AlertDescription>
        
        <div className="mt-4 flex space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetry}
            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onGoBack}
            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Go back
          </Button>
        </div>
      </Alert>
      
      {isApiDown && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <WifiOff className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-medium text-gray-800">API Connection Issue</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            This application relies on the LegiScan API to retrieve bill information. 
            When the API is temporarily unavailable or experiencing high traffic, 
            we may not be able to retrieve the requested bill details.
          </p>
          
          <h3 className="font-medium text-gray-800 mb-1">What you can do:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Try again in a few minutes</li>
            <li>Check if you have the correct bill ID</li>
            <li>Return to the search page and try a different search</li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
              <p className="text-sm text-gray-500">We're monitoring the API status and will restore functionality as soon as possible.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillDetailError;
