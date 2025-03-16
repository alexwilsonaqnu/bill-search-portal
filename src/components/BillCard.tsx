
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Tag, Flag } from "lucide-react";
import { Bill } from "@/types";
import { Link } from "react-router-dom";

interface BillCardProps {
  bill: Bill;
  className?: string;
  animationDelay?: string;
}

const BillCard = ({ bill, className = "", animationDelay }: BillCardProps) => {
  // Format the title to be more human-readable
  const formatTitle = () => {
    // If it has a proper title that isn't just the ID, use it
    if (bill.title && bill.title.length > 10 && !bill.title.includes(bill.id)) {
      return bill.title;
    }
    
    // Create a title from the first sentence of the description
    const firstSentence = bill.description?.split('.')?.filter(s => s.trim().length > 0)?.[0];
    if (firstSentence && firstSentence.length > 10) {
      return firstSentence;
    }
    
    // Fallback to basic format
    return `${bill.title || bill.id} - Legislative Proposal`;
  };

  // Get a concise summary from the description
  const getSummary = () => {
    if (!bill.description) return "No description available";
    
    // Use the description without the first sentence as summary
    const sentences = bill.description.split('.').filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      const remainingSentences = sentences.slice(1).join('. ');
      if (remainingSentences.length > 150) {
        return remainingSentences.substring(0, 150) + "...";
      }
      return remainingSentences;
    }
    
    // If there's only one sentence, use a portion as summary
    if (bill.description.length > 150) {
      return bill.description.substring(0, 150) + "...";
    }
    
    return bill.description;
  };

  // Get the sponsor or authors if available
  const getSponsor = () => {
    if (bill.data?.sponsor) return bill.data.sponsor;
    if (bill.data?.author) return bill.data.author;
    if (bill.data?.sponsors && bill.data.sponsors.length > 0) {
      return Array.isArray(bill.data.sponsors) 
        ? bill.data.sponsors[0] 
        : bill.data.sponsors;
    }
    return null;
  };

  // Get relevant dates (introduced, last action, etc)
  const getRelevantDate = () => {
    if (bill.lastUpdated) return bill.lastUpdated;
    if (bill.data?.introducedDate) return bill.data.introducedDate;
    if (bill.data?.lastActionDate) return bill.data.lastActionDate;
    return "N/A";
  };

  // Get tags or categories if available
  const getTags = () => {
    if (!bill.data) return [];
    
    const possibleTagFields = ['topics', 'categories', 'tags', 'subjects'];
    for (const field of possibleTagFields) {
      if (bill.data[field] && Array.isArray(bill.data[field]) && bill.data[field].length > 0) {
        return bill.data[field].slice(0, 2); // Return max 2 tags
      }
    }
    
    return [];
  };
  
  const sponsor = getSponsor();
  const tags = getTags();
  const relevantDate = getRelevantDate();

  return (
    <Card 
      className={`bill-card overflow-hidden animate-fade-up hover:shadow-md transition-all ${className}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {bill.id}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {relevantDate}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-medium mb-2 text-blue-800">{formatTitle()}</h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{getSummary()}</p>
        
        {/* Sponsor info if available */}
        {sponsor && (
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <span className="mr-2">Sponsor:</span>
            <span className="font-medium">{sponsor}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div className="flex flex-wrap gap-2">
            {/* Status badge */}
            {bill.status && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                <Flag className="h-3 w-3" /> {bill.status}
              </span>
            )}
            
            {/* Versions badge */}
            {bill.versions && bill.versions.length > 0 && (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {bill.versions.length} version{bill.versions.length > 1 ? 's' : ''}
              </span>
            )}
            
            {/* Tags badges */}
            {tags.map((tag, index) => (
              <span key={index} className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center gap-1">
                <Tag className="h-3 w-3" /> {tag}
              </span>
            ))}
          </div>
          
          <Link to={`/bill/${bill.id}`} className="ml-auto mt-auto">
            <Button 
              className="select-button"
              variant="default"
              size="sm"
            >
              VIEW DETAILS
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillCard;
