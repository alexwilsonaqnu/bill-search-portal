
import { useEffect, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import SponsorContactInfo from "./SponsorContactInfo";
import { MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
  legislatorId?: string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName, legislatorId }: SponsorHoverCardProps) => {
  const sponsorName = getSponsorName(sponsorData);
  const [isHovering, setIsHovering] = useState(false);
  const [loadDelay, setLoadDelay] = useState<NodeJS.Timeout | null>(null);
  
  // Only enable the query when hovering, with a small delay to prevent unnecessary API calls
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(
    isHovering ? legislatorId : undefined, 
    isHovering ? sponsorName : undefined
  );
  
  // Handle hover events with delay
  const handleHoverStart = () => {
    // Clear any existing delay
    if (loadDelay) clearTimeout(loadDelay);
    
    // Set a delay before triggering the data load
    const delay = setTimeout(() => {
      setIsHovering(true);
    }, 300); // 300ms delay before loading data
    
    setLoadDelay(delay);
  };
  
  const handleHoverEnd = () => {
    // Clear the delay if exists
    if (loadDelay) {
      clearTimeout(loadDelay);
      setLoadDelay(null);
    }
    // Don't immediately disable the query to avoid flicker if user re-hovers quickly
    setTimeout(() => {
      setIsHovering(false);
    }, 1000);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (loadDelay) clearTimeout(loadDelay);
    };
  }, [loadDelay]);

  // If we don't have a legislator ID or name, use a simpler tooltip
  if (!legislatorId && !sponsorName) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-pointer hover:text-blue-600 transition-colors">
            {sponsorName}
          </TooltipTrigger>
          <TooltipContent>
            No additional information available
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger 
        className="cursor-pointer hover:text-blue-600 transition-colors"
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onFocus={handleHoverStart}
        onBlur={handleHoverEnd}
      >
        {sponsorName}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{legislatorInfo?.name?.full || sponsorName}</h4>
          
          {isHovering && isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner className="h-6 w-6 text-blue-600" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">Error loading legislator info</p>
          ) : legislatorInfo ? (
            <>
              <p className="text-sm text-gray-600">
                Party: {legislatorInfo.party === 'D' ? 'Democratic' : 
                       legislatorInfo.party === 'R' ? 'Republican' : 
                       legislatorInfo.party}
              </p>
              {legislatorInfo.role && legislatorInfo.district && (
                <p className="text-sm text-gray-600">
                  {legislatorInfo.role}, District {legislatorInfo.district}
                </p>
              )}
              {legislatorInfo.office && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {legislatorInfo.office}
                </p>
              )}
              <SponsorContactInfo 
                emails={legislatorInfo.email} 
                phones={legislatorInfo.phone}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500">No legislator information available</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SponsorHoverCard;
