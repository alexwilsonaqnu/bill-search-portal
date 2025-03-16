
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ChangeIndex from "@/components/ChangeIndex";
import VersionComparison from "@/components/VersionComparison";
import { fetchBillById } from "@/services/s3Service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BillDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTool, setSelectedTool] = useState<"overview" | "comparison">("overview");

  const { data: bill, isLoading, error } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => fetchBillById(id!),
    enabled: !!id,
  });

  if (error) {
    toast.error("Failed to load bill details. Please try again later.");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-28 pb-20 px-6 animate-fade-in">
          <div className="h-16 w-3/4 bg-gray-100 rounded animate-pulse-light mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="h-64 bg-gray-100 rounded animate-pulse-light"></div>
            </div>
            <div className="md:col-span-2">
              <div className="h-96 bg-gray-100 rounded animate-pulse-light"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-28 pb-20 px-6 text-center animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4">Bill Not Found</h2>
          <p className="mb-6">The bill you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-transition-wrapper">
      <Navbar />
      
      <div className="max-w-6xl mx-auto pt-28 pb-20 px-6">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to search
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{bill.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border shadow-sm p-6 mb-6 sticky top-28">
              <h2 className="text-xl font-semibold mb-1">Billinois</h2>
              <h3 className="text-lg mb-6">Choose Tool</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedTool("overview")}
                  className={cn(
                    "flex items-start w-full text-left px-3 py-2 rounded-md transition-colors",
                    selectedTool === "overview" 
                      ? "bg-gray-100" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <Star className="h-5 w-5 mr-3 mt-0.5" />
                  <div>
                    <div className="font-medium">Overall view</div>
                    <div className="text-sm text-gray-600">See overall bill information</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setSelectedTool("comparison")}
                  className={cn(
                    "flex items-start w-full text-left px-3 py-2 rounded-md transition-colors",
                    selectedTool === "comparison" 
                      ? "bg-gray-100" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <Star className="h-5 w-5 mr-3 mt-0.5" />
                  <div>
                    <div className="font-medium">Comparison Tool</div>
                    <div className="text-sm text-gray-600">Compare different versions of the bill</div>
                  </div>
                </button>
              </div>
              
              {bill.changes && bill.changes.length > 0 && (
                <div className="mt-8">
                  <ChangeIndex changes={bill.changes} />
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedTool === "overview" ? (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">Bill Overview</h2>
                <p className="mb-6 text-gray-700">{bill.description}</p>
                
                {bill.status && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Status</h3>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {bill.status}
                    </span>
                  </div>
                )}
                
                {bill.lastUpdated && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Last Updated</h3>
                    <p>{bill.lastUpdated}</p>
                  </div>
                )}
                
                {bill.versions && bill.versions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Bill Versions</h3>
                    <div className="space-y-4">
                      {bill.versions.map((version) => (
                        <div key={version.id} className="border rounded-lg p-4">
                          <h4 className="font-medium">{version.name}</h4>
                          <p className="text-sm text-gray-500">{version.date}</p>
                          
                          <div className="mt-4 space-y-4">
                            {version.sections.map((section) => (
                              <div key={section.id}>
                                <h5 className="font-medium text-brand-primary">{section.title}</h5>
                                <p className="mt-2 text-gray-700">{section.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Version Comparison</h2>
                {bill.versions && bill.versions.length > 1 ? (
                  <VersionComparison versions={bill.versions} />
                ) : (
                  <p className="text-gray-500">This bill only has one version. Comparison is not available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetail;
