
import { Card } from "@/components/ui/card";
import TextContentDisplay from "./text/TextContentDisplay";

interface BillTextContentProps {
  textContent: string;
  textFormat: 'html' | 'text';
}

const BillTextContent = ({ textContent, textFormat }: BillTextContentProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4">Bill Text Content</h2>
      <div className="prose max-w-none">
        <TextContentDisplay 
          content={textContent}
          isHtml={textFormat === 'html'}
        />
      </div>
    </Card>
  );
};

export default BillTextContent;
