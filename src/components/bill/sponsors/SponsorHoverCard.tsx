
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import SponsorContactInfo from "./SponsorContactInfo";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName }: SponsorHoverCardProps) => {
  // Extract identifier - prefer ID but fall back to name
  const legislatorId = sponsorData.people_id || sponsorData.id;
  const sponsorName = getSponsorName(sponsorData);
  
  // Use ID if available, otherwise use name
  const lookupParams = legislatorId ? { legislatorId } : { name: sponsorName };
  const { data: legislatorInfo, isLoading, error } = useLegislatorInfo(lookupParams);
  
  console.log("SponsorHoverCard for legislator:", legislatorId || sponsorName, { 
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
          <h4 className="text-sm font-semibold">{sponsorName}</h4>
          {isLoading && <p className="text-sm text-gray-500">Loading legislator info...</p>}
          {error && <p className="text-sm text-red-500">Error loading legislator info</p>}
          {legislatorInfo && (
            <>
              <p className="text-sm text-gray-600">
                Party Affiliation: {legislatorInfo.party}
              </p>
              <SponsorContactInfo 
                emails={legislatorInfo.email} 
                phones={legislatorInfo.phone}
              />
              {(!legislatorInfo.email?.length && !legislatorInfo.phone?.length) && (
                <p className="text-sm text-gray-500 italic">No contact information available</p>
              )}
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SponsorHoverCard;
