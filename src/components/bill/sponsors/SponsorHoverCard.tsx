
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import SponsorContactInfo from "./SponsorContactInfo";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName }: SponsorHoverCardProps) => {
  const sponsorName = getSponsorName(sponsorData);
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(sponsorName);
  
  console.log("SponsorHoverCard for legislator:", sponsorName, { 
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
          {error && <p className="text-sm text-gray-500">Legislator info temporarily unavailable</p>}
          {legislatorInfo && (
            <>
              <p className="text-sm text-gray-600">
                Party: {legislatorInfo.party === 'Democratic' ? 'Democratic' : 
                       legislatorInfo.party === 'Republican' ? 'Republican' : 
                       legislatorInfo.party}
              </p>
              {legislatorInfo.role && legislatorInfo.district && (
                <p className="text-sm text-gray-600">
                  {legislatorInfo.role}, District {legislatorInfo.district}
                </p>
              )}
              <SponsorContactInfo 
                emails={legislatorInfo.email} 
                phones={legislatorInfo.phone}
              />
              {(!legislatorInfo.email?.length && !legislatorInfo.phone?.length) && (
                <p className="text-sm text-gray-500 italic">No contact information available</p>
              )}
            </>
          )}
          {!legislatorInfo && !isLoading && !error && (
            <p className="text-sm text-gray-500 italic">No additional information available</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SponsorHoverCard;
