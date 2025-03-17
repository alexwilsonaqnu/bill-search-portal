
import { Card } from "@/components/ui/card";

interface ExternalContentProps {
  content: string;
}

const ExternalContent = ({ content }: ExternalContentProps) => {
  return (
    <Card className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4">Bill Text Content (External)</h2>
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </Card>
  );
};

export default ExternalContent;
