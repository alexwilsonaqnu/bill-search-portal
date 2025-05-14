
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
  
  // Always log the sponsor data to help with debugging
  useEffect(() => {
    console.log('SponsorHoverCard data:', { 
      sponsorName,
      legislatorId
    });
  }, [sponsorName, legislatorId]);
  
  // If we don't have a legislator ID or name, use a simpler tooltip
  if (!legislatorId && !sponsorName) {
    return <SponsorTooltip sponsorName={"Unknown Sponsor"} />;
  }
  
  // Only fetch data when the popover is opened to reduce API calls
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(
    isOpen ? legislatorId : undefined, 
    isOpen ? sponsorName : undefined
  );

  // Log when legislator info changes
  useEffect(() => {
    if (isOpen) {
      if (error) {
        console.error(`Error loading legislator: ${error.message}`);
        // Fix: Using the correct toast function signature for sonner
        toast.error(`Unable to load information for ${sponsorName}`);
      } else if (!isLoading) {
        console.log('Legislator info loaded:', legislatorInfo);
      }
    }
  }, [legislatorInfo, isLoading, error, isOpen, sponsorName]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        className="cursor-pointer hover:text-blue-600 transition-colors"
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
