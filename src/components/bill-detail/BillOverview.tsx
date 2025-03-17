
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
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
      
      {/* Raw JSON Data */}
      <Card className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Raw JSON Data</h3>
        <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
          <pre className="text-xs text-gray-800">{JSON.stringify(bill.data, null, 2)}</pre>
        </div>
      </Card>
    </div>
  );
};

export default BillOverview;
