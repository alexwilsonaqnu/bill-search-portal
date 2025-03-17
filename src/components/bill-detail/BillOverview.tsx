
import { useState } from "react";
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState(false);
  const [externalContent, setExternalContent] = useState<string | null>(null);
  
  // Function to extract the ILGA URL if present in the bill data
  const getIlgaUrl = () => {
    if (bill.data?.texts?.[0]?.state_link) {
      return bill.data.texts[0].state_link;
    }
    if (bill.data?.text_url) {
      return bill.data.text_url;
    }
    // Look for a URL pattern in any field
    const billString = JSON.stringify(bill.data);
    const urlMatch = billString.match(/https?:\/\/www\.ilga\.gov\/legislation\/\S+\.htm/);
    return urlMatch ? urlMatch[0] : null;
  };
  
  // Extract the ILGA URL
  const ilgaUrl = getIlgaUrl();
  
  // Check if bill has text content - look in multiple possible locations
  const getTextContent = () => {
    // Direct text_content field
    if (bill.data?.text_content) return bill.data.text_content;
    
    // Check in texts array
    if (bill.data?.texts && Array.isArray(bill.data.texts)) {
      const textWithContent = bill.data.texts.find(t => t.content);
      if (textWithContent) return textWithContent.content;
    }
    
    // Check in text field
    if (bill.data?.text) return bill.data.text;
    
    // Check in full_text field
    if (bill.data?.full_text) return bill.data.full_text;
    
    return null;
  };
  
  const billTextContent = getTextContent();
  const hasTextContent = !!billTextContent;
  
  // Extract the text hash from bill data
  const textHash = bill.data?.text_hash || "";
  
  // Determine text format (html or plain text)
  const getTextFormat = () => {
    if (bill.data?.text_format) return bill.data.text_format;
    
    // Try to auto-detect format
    if (billTextContent && typeof billTextContent === 'string') {
      if (billTextContent.trim().startsWith('<') && billTextContent.includes('</')) {
        return 'html';
      }
    }
    
    return 'text';
  };
  
  const textFormat = getTextFormat();
  
  // Function to fetch the content from ILGA website
  const fetchExternalContent = async () => {
    if (!ilgaUrl) {
      toast.error("No external URL found for this bill");
      return;
    }
    
    setIsLoadingExternalContent(true);
    toast.info("Fetching bill text from ILGA website...");
    
    try {
      // We need to use a proxy to bypass CORS restrictions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-content?url=${encodeURIComponent(ilgaUrl)}`);
      
      if (response.ok) {
        const text = await response.text();
        setExternalContent(text);
        toast.success("Successfully loaded bill text");
      } else {
        console.error("Failed to fetch content:", response.statusText);
        toast.error(`Failed to load content: ${response.statusText}`);
        setExternalContent(`Failed to load content from ${ilgaUrl}`);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error(`Error fetching content: ${error instanceof Error ? error.message : String(error)}`);
      setExternalContent(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingExternalContent(false);
    }
  };
  
  console.log("Bill data:", {
    hasTextContent,
    textFormat,
    billTextAvailable: !!billTextContent,
    billDataKeys: bill.data ? Object.keys(bill.data) : [],
    externalUrl: ilgaUrl,
    textHash
  });
  
  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Bill Overview</h2>
        
        <div className="space-y-6">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold mb-2 text-lg">Title</h3>
            <p className="mb-4 text-gray-700">{bill.title}</p>
            
            {bill.description && (
              <>
                <h3 className="font-semibold mb-2 text-lg">Description</h3>
                <p className="mb-4 text-gray-700">{bill.description}</p>
              </>
            )}
          </div>
          
          {/* Status and Last Updated */}
          <div className="flex flex-wrap gap-4">
            {bill.status && (
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-800 border-blue-200">
                  {bill.status}
                </Badge>
              </div>
            )}
            
            {bill.lastUpdated && (
              <div>
                <h3 className="font-semibold mb-2">Last Updated</h3>
                <p className="text-gray-700">{bill.lastUpdated}</p>
              </div>
            )}
          </div>
          
          {/* Bill ID */}
          <div>
            <h3 className="font-semibold mb-2">Bill ID</h3>
            <p className="text-gray-700">{bill.id}</p>
          </div>
          
          {/* Sponsors if available */}
          {bill.data?.sponsors && (
            <div>
              <h3 className="font-semibold mb-2">Sponsors</h3>
              <div className="text-gray-700">
                {bill.data.sponsors.primary && (
                  <p><strong>Primary:</strong> {bill.data.sponsors.primary}</p>
                )}
                {bill.data.sponsors.cosponsor && Array.isArray(bill.data.sponsors.cosponsor) && (
                  <p><strong>Co-sponsors:</strong> {bill.data.sponsors.cosponsor.join(', ')}</p>
                )}
              </div>
            </div>
          )}
          
          {/* External Bill Link */}
          {ilgaUrl && (
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
          )}
          
          {/* Bill Text Hash */}
          {textHash && (
            <div>
              <h3 className="font-semibold mb-2">Text Hash (MD5)</h3>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded border">
                {textHash}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This MD5 hash represents the unique fingerprint of the bill's text content
              </p>
            </div>
          )}
          
          {/* Bill changes history */}
          {bill.changes && bill.changes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Bill History</h3>
              <ul className="list-disc pl-5 space-y-1">
                {bill.changes.map((change) => (
                  <li key={change.id} className="text-gray-700">
                    <span>{change.description}</span>
                    {change.details && <span className="text-gray-500 ml-2">({change.details})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
      
      {/* Bill Text Content Display */}
      {hasTextContent && (
        <Card className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Bill Text Content</h2>
          <div className="prose max-w-none">
            {textFormat === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: billTextContent }} />
            ) : (
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-[800px]">
                {billTextContent}
              </pre>
            )}
          </div>
        </Card>
      )}
      
      {/* External Content Display */}
      {externalContent && !hasTextContent && (
        <Card className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Bill Text Content (External)</h2>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: externalContent }} />
          </div>
        </Card>
      )}
      
      {/* Bill Versions */}
      {bill.versions && bill.versions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-xl">Bill Content</h3>
          
          {bill.versions.map((version) => (
            <Card key={version.id} className="border rounded-lg p-4">
              <h4 className="font-medium text-lg">{version.name}</h4>
              {version.date && <p className="text-sm text-gray-500 mb-4">{version.date}</p>}
              
              <div className="mt-4 space-y-6">
                {version.sections.map((section) => (
                  <div key={section.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <h5 className="font-medium text-blue-800 mb-3">{section.title}</h5>
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-x-auto">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* No Content Notice */}
      {!hasTextContent && !externalContent && !bill.versions?.length && (
        <Card className="bg-white rounded-lg border shadow-sm p-6">
          <div className="text-center py-8">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Bill Text Available</h3>
            <p className="text-gray-600 mb-6">
              The full text for this bill is not currently available in our system.
            </p>
            
            {ilgaUrl ? (
              <Button onClick={fetchExternalContent} disabled={isLoadingExternalContent}>
                {isLoadingExternalContent ? "Loading..." : "Load Text from ILGA Website"}
              </Button>
            ) : (
              <p className="italic text-gray-500">
                No external source is available for this bill.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BillOverview;
