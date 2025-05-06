
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import SponsorContactInfo from "./SponsorContactInfo";
import { MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
  legislatorId?: string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName, legislatorId }: SponsorHoverCardProps) => {
  const sponsorName = getSponsorName(sponsorData);
  
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(legislatorId || '', sponsorName);
  
  console.log("SponsorHoverCard for legislator:", legislatorId, { 
    sponsorName,
    legislatorInfo,
    isLoading,
    hasError: !!error
  });

  return (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer hover:text-blue-600 transition-colors">
        {sponsorName}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
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
      </HoverCardContent>
    </HoverCard>
  );
};

export default SponsorHoverCard;
