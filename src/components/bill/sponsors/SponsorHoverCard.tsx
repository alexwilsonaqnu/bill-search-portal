
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import SponsorContactInfo from "./SponsorContactInfo";
import { MapPin } from "lucide-react";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName }: SponsorHoverCardProps) => {
  const legislatorId = sponsorData.people_id || sponsorData.id;
  const sponsorName = getSponsorName(sponsorData);
  
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(legislatorId, sponsorName);
  
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
          {isLoading && <p className="text-sm text-gray-500">Loading legislator info...</p>}
          {error && <p className="text-sm text-red-500">Error loading legislator info</p>}
          {legislatorInfo && (
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
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SponsorHoverCard;
