
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

interface BillDetailErrorProps {
  id?: string;
}

const BillDetailError = ({ id }: BillDetailErrorProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-28 pb-20 px-6 text-center animate-fade-in">
        <div className="flex flex-col items-center justify-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Bill Not Found</h2>
          <p className="mb-6">
            We couldn't find bill {id} in our database. This might be due to:
          </p>
          <ul className="list-disc text-left mb-6 max-w-md">
            <li className="mb-2">The bill ID you entered is incorrect</li>
            <li className="mb-2">The bill hasn't been uploaded to our system yet</li>
            <li className="mb-2">There was an error connecting to the data source</li>
          </ul>
          <Link to="/">
            <Button>Return to Bill Search</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BillDetailError;
