
import { MapPin } from "lucide-react";
import SponsorContactInfo from "./SponsorContactInfo";
import { Spinner } from "@/components/ui/spinner";
import { LegislatorInfo } from "@/services/legislator/types";

interface LegislatorDetailsProps {
  legislatorInfo: LegislatorInfo | null;
  isLoading: boolean;
  error: Error | null;
  sponsorName: string;
}

const LegislatorDetails = ({ legislatorInfo, isLoading, error, sponsorName }: LegislatorDetailsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner className="h-6 w-6 text-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <p className="text-sm text-red-500">
        Error loading legislator info: {error.message || 'Unknown error'}
      </p>
    );
  }
  
  if (!legislatorInfo) {
    return (
      <p className="text-sm text-gray-500">No legislator information available</p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{legislatorInfo.name?.full || sponsorName}</h4>
      
      <p className="text-sm text-gray-600">
        Party: {legislatorInfo.party === 'D' ? 'Democratic' : 
              legislatorInfo.party === 'R' ? 'Republican' : 
              legislatorInfo.party || 'Unknown'}
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
    </div>
  );
};

export default LegislatorDetails;
