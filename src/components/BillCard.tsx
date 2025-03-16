import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Tag, Flag, Activity, Users } from "lucide-react";
import { Bill } from "@/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface BillCardProps {
  bill: Bill;
  className?: string;
  animationDelay?: string;
}

const BillCard = ({ bill, className = "", animationDelay }: BillCardProps) => {
  const formatTitle = () => {
    if (bill.title && bill.title.length > 10 && !bill.title.includes(bill.id)) {
      return bill.title;
    }
    
    const firstSentence = bill.description?.split('.')?.filter(s => s.trim().length > 0)?.[0];
    if (firstSentence && firstSentence.length > 10) {
      return firstSentence;
    }
    
    return `${bill.title || bill.id} - Legislative Proposal`;
  };

  const getSummary = () => {
    if (!bill.description) return "No description available";
    
    const sentences = bill.description.split('.').filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      const remainingSentences = sentences.slice(1).join('. ');
      if (remainingSentences.length > 150) {
        return remainingSentences.substring(0, 150) + "...";
      }
      return remainingSentences;
    }
    
    if (bill.description.length > 150) {
      return bill.description.substring(0, 150) + "...";
    }
    
    return bill.description;
  };

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

  const getCoSponsors = () => {
    if (!bill.data) return [];
    
    const possibleFields = ['cosponsors', 'co_sponsors', 'coSponsors', 'co-sponsors'];
    
    for (const field of possibleFields) {
      if (bill.data[field] && Array.isArray(bill.data[field]) && bill.data[field].length > 0) {
        return bill.data[field].slice(0, 3);
      }
    }
    
    return [];
  };

  const getRelevantDate = () => {
    if (bill.lastUpdated) return bill.lastUpdated;
    if (bill.data?.introducedDate) return bill.data.introducedDate;
    if (bill.data?.lastActionDate) return bill.data.lastActionDate;
    return "N/A";
  };

  const getMostRecentAction = () => {
    if (!bill.data) return null;
    
    const possibleFields = ['lastAction', 'last_action', 'recentAction', 'recent_action', 'latestAction'];
    
    for (const field of possibleFields) {
      if (bill.data[field] && typeof bill.data[field] === 'string') {
        return bill.data[field];
      }
      
      if (bill.data[field] && typeof bill.data[field] === 'object') {
        const actionObj = bill.data[field];
        if (actionObj.description || actionObj.text || actionObj.action) {
          return actionObj.description || actionObj.text || actionObj.action;
        }
      }
    }
    
    return null;
  };

  const getActionType = () => {
    if (!bill.data) return null;
    
    const possibleFields = ['actionType', 'action_type', 'type', 'lastActionType'];
    
    for (const field of possibleFields) {
      if (bill.data[field] && typeof bill.data[field] === 'string') {
        return bill.data[field];
      }
    }
    
    return null;
  };

  const getTags = () => {
    if (!bill.data) return [];
    
    const possibleTagFields = ['topics', 'categories', 'tags', 'subjects'];
    for (const field of possibleTagFields) {
      if (bill.data[field] && Array.isArray(bill.data[field]) && bill.data[field].length > 0) {
        return bill.data[field].slice(0, 2);
      }
    }
    
    return [];
  };
  
  const getFirstThreeLines = () => {
    if (!bill.versions || bill.versions.length === 0 || !bill.versions[0].sections || bill.versions[0].sections.length === 0) {
      return null;
    }
    
    const firstContent = bill.versions[0].sections.find(section => section.content)?.content;
    
    if (!firstContent) return null;
    
    const lines = firstContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;
    
    const firstThreeLines = lines.slice(0, 3).join('\n');
    return firstThreeLines;
  };
  
  const sponsor = getSponsor();
  const coSponsors = getCoSponsors();
  const tags = getTags();
  const relevantDate = getRelevantDate();
  const firstThreeLines = getFirstThreeLines();
  const mostRecentAction = getMostRecentAction();
  const actionType = getActionType();

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
        
        {bill.data?.description && bill.data.description !== bill.description && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Official Description:</h4>
            <p className="text-gray-600 text-sm line-clamp-2">{bill.data.description}</p>
          </div>
        )}
        
        {mostRecentAction && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Activity className="h-3 w-3" /> Recent Action:
            </h4>
            <p className="text-gray-600 text-sm line-clamp-2">{mostRecentAction}</p>
            {actionType && (
              <Badge variant="outline" className="mt-1 text-xs">
                {actionType}
              </Badge>
            )}
          </div>
        )}
        
        {firstThreeLines && (
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-md mb-4 text-xs text-gray-700 italic">
            <p className="line-clamp-3 whitespace-pre-line">{firstThreeLines}</p>
          </div>
        )}
        
        {sponsor && (
          <div className="flex items-center text-xs text-gray-600 mb-1">
            <span className="mr-2">Sponsor:</span>
            <span className="font-medium">{sponsor}</span>
          </div>
        )}
        
        {coSponsors.length > 0 && (
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <span className="mr-2 flex items-center gap-1">
              <Users className="h-3 w-3" /> Co-sponsors:
            </span>
            <span className="font-medium">
              {coSponsors.join(", ")}
              {bill.data?.cosponsors?.length > 3 && ` +${bill.data.cosponsors.length - 3} more`}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" /> {tag}
              </Badge>
            ))}
          </div>
          
          <Link to={`/bill/${bill.id}`} className="inline-block">
            <Button size="sm" variant="ghost" className="text-xs">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillCard;
