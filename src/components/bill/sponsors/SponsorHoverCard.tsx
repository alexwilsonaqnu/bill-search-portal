
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import LegislatorDetails from "./LegislatorDetails";
import SponsorTooltip from "./SponsorTooltip";
import { toast } from "@/components/ui/use-toast";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
  legislatorId?: string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName, legislatorId }: SponsorHoverCardProps) => {
  const sponsorName = getSponsorName(sponsorData);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Always log the sponsor data to help with debugging
  useEffect(() => {
    console.log('SponsorHoverCard data:', { 
      sponsorData, 
      legislatorId, 
      sponsorName 
    });
  }, [sponsorData, legislatorId, sponsorName]);
  
  // If we don't have a legislator ID or name, use a simpler tooltip
  if (!legislatorId && !sponsorName) {
    console.log('SponsorHoverCard: No ID or name available, using simple tooltip');
    return <SponsorTooltip sponsorName={"Unknown Sponsor"} />;
  }
  
  // Only fetch data when the popover is opened to reduce API calls
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(
    isOpen ? legislatorId : undefined, 
    isOpen ? sponsorName : undefined
  );

  // Log when we're fetching legislator info
  useEffect(() => {
    if (isOpen) {
      console.log(`SponsorHoverCard: Open state changed to ${isOpen}, triggering data fetch`);
      console.log(`Fetching legislator info with: id=${legislatorId}, name=${sponsorName}`);
      setHasAttemptedLoad(true);
    }
  }, [isOpen, legislatorId, sponsorName]);

  // Log when legislator info changes
  useEffect(() => {
    if (isOpen && hasAttemptedLoad) {
      console.log('SponsorHoverCard: legislatorInfo result:', { 
        legislatorInfo, 
        isLoading, 
        error 
      });
      
      // Show a toast if there's an error with additional details
      if (error) {
        toast.error(`Could not load details for ${sponsorName}`);
      }
    }
  }, [legislatorInfo, isLoading, error, isOpen, hasAttemptedLoad, sponsorName]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        className="cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => {
          // Log when popover is clicked
          console.log(`Popover clicked for: ${sponsorName} (${legislatorId || 'no ID'})`);
        }}
      >
        {sponsorName || "Unknown Sponsor"}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <LegislatorDetails 
          legislatorInfo={legislatorInfo}
          isLoading={isLoading}
          error={error}
          sponsorName={sponsorName}
        />
      </PopoverContent>
    </Popover>
  );
};

export default SponsorHoverCard;
