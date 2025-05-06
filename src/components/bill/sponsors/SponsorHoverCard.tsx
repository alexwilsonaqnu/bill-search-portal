
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [isOpen, setIsOpen] = useState(false);
  
  // Only fetch data when the popover is opened
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(
    isOpen ? legislatorId : undefined, 
    isOpen ? sponsorName : undefined
  );

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        className="cursor-pointer hover:text-blue-600 transition-colors"
      >
        {sponsorName}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{legislatorInfo?.name?.full || sponsorName}</h4>
          
          {isLoading ? (
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
      </PopoverContent>
    </Popover>
  );
};

export default SponsorHoverCard;
