
import { Bill, BillVersion, BillSection } from "@/types";
import { Card } from "@/components/ui/card";

interface BillVersionsProps {
  versions: BillVersion[];
}

const BillVersions = ({ versions }: BillVersionsProps) => {
  if (!versions.length) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-xl">Bill Content</h3>
      
      {versions.map((version) => (
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
  );
};

export default BillVersions;
