
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bill } from "@/types";
import { getTags } from "@/utils/billCardUtils";

interface BillFooterProps {
  bill: Bill;
}

const BillFooter = ({ bill }: BillFooterProps) => {
  const tags = getTags(bill);
  
  // Ensure we have a valid ID for the link
  const billId = bill.id || '';
  
  // Add logging to help debug bill ID issues
  const handleViewDetails = () => {
    console.log(`Viewing bill details for ID: ${billId}`, {
      billData: {
        id: billId,
        title: bill.title?.substring(0, 30) + "...",
        hasData: !!bill.data
      }
    });
    
    // Store individual bill in localStorage for improved reliability
    try {
      localStorage.setItem(`bill_${billId}`, JSON.stringify(bill));
      console.log(`Stored bill ${billId} in localStorage for backup retrieval`);
      
      // If this bill has a Legiscan bill_id that's different, store an ID mapping
      const billData = bill.data?.bill || bill.data;
      if (billData?.bill_id && billData.bill_id.toString() !== billId) {
        const legiscanId = billData.bill_id.toString();
        console.log(`Storing alternate ID mapping: ${legiscanId} -> ${billId}`);
        
        // Get or initialize the mappings object
        const existingMappings = localStorage.getItem('billIdMappings') || '{}';
        const mappings = JSON.parse(existingMappings);
        
        // Add the mapping both ways
        mappings[legiscanId] = billId;
        mappings[billId] = legiscanId;
        
        localStorage.setItem('billIdMappings', JSON.stringify(mappings));
      }
    } catch (e) {
      console.warn("Failed to store bill in localStorage:", e);
    }
  };
  
  return (
    <div className="flex items-center justify-between flex-wrap gap-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" /> {tag}
          </Badge>
        ))}
      </div>
      
      <Link to={`/bill/${billId}`} className="inline-block" onClick={handleViewDetails}>
        <Button size="sm" variant="ghost" className="text-xs">
          View Details
        </Button>
      </Link>
    </div>
  );
};

export default BillFooter;
