
import { Bill } from "@/types";

interface BillOverviewProps {
  bill: Bill;
}

const BillOverview = ({ bill }: BillOverviewProps) => {
  return (
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
  );
};

export default BillOverview;
