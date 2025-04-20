
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyBillContentProps {
  bill: Bill;
  ilgaUrl: string | null;
  isLoadingExternalContent: boolean;
  fetchExternalContent: () => Promise<void>;
}

const EmptyBillContent = ({ 
  bill,
  ilgaUrl, 
  isLoadingExternalContent, 
  fetchExternalContent 
}: EmptyBillContentProps) => {
  // Completely remove the loading if any data suggests content exists
  const showEmptyContent = !bill.data || 
    (!bill.data.text_content && 
     !bill.data.full_text && 
     (!bill.data.texts || bill.data.texts.length === 0));

  if (!showEmptyContent) return null;

  return (
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
  );
};

export default EmptyBillContent;
