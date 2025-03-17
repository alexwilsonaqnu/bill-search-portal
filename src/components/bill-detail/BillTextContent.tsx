
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";

interface BillTextContentProps {
  textContent: string;
  textFormat: 'html' | 'text';
}

const BillTextContent = ({ textContent, textFormat }: BillTextContentProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4">Bill Text Content</h2>
      <div className="prose max-w-none">
        {textFormat === 'html' ? (
          <div 
            dangerouslySetInnerHTML={{ __html: textContent }} 
            className="bg-white p-4 rounded-md overflow-auto max-h-[800px] bill-text-content"
          />
        ) : (
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-[800px]">
            {textContent}
          </pre>
        )}
      </div>
    </Card>
  );
};

export default BillTextContent;
