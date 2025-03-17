
import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BillResourceLinksProps {
  ilgaUrl: string | null;
  isLoadingExternalContent: boolean;
  fetchExternalContent: () => Promise<void>;
}

const BillResourceLinks = ({ 
  ilgaUrl, 
  isLoadingExternalContent, 
  fetchExternalContent 
}: BillResourceLinksProps) => {
  if (!ilgaUrl) return null;
  
  return (
    <div>
      <h3 className="font-semibold mb-2">External Resources</h3>
      <div className="flex flex-wrap gap-3">
        <a 
          href={ilgaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View on ILGA Website
        </a>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchExternalContent}
          disabled={isLoadingExternalContent}
          className="inline-flex items-center"
        >
          <FileText className="h-4 w-4 mr-1" />
          {isLoadingExternalContent ? "Loading..." : "Load Bill Text"}
        </Button>
      </div>
    </div>
  );
};

export default BillResourceLinks;
