
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLegislatorInfo } from "@/hooks/useLegislatorInfo";
import SponsorContactInfo from "./SponsorContactInfo";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName }: SponsorHoverCardProps) => {
  const legislatorId = sponsorData.people_id || sponsorData.id;
  const { data: legislatorInfo } = useLegislatorInfo(legislatorId);

  return (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer hover:text-blue-600 transition-colors">
        {getSponsorName(sponsorData)}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{getSponsorName(sponsorData)}</h4>
          {legislatorInfo && (
            <>
              <p className="text-sm text-gray-600">
                Party Affiliation: {legislatorInfo.party}
              </p>
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
