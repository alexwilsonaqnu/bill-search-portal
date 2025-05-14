
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
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{sponsorName}</h4>
        <p className="text-sm text-red-500">
          Error loading additional info: {error.message || 'Unknown error'}
        </p>
      </div>
    );
  }
  
  if (!legislatorInfo) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{sponsorName}</h4>
        <p className="text-sm text-gray-500">No additional information available</p>
      </div>
    );
  }

  // Determine if we have real data or just fallback data
  const hasMeaningfulData = legislatorInfo.party || 
                           legislatorInfo.district || 
                           legislatorInfo.role || 
                           legislatorInfo.office || 
                           (legislatorInfo.email && legislatorInfo.email.length > 0) || 
                           (legislatorInfo.phone && legislatorInfo.phone.length > 0);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{legislatorInfo.name?.full || sponsorName}</h4>
      
      {legislatorInfo.party && (
        <p className="text-sm text-gray-600">
          Party: {legislatorInfo.party === 'D' ? 'Democratic' : 
                legislatorInfo.party === 'R' ? 'Republican' : 
                legislatorInfo.party}
        </p>
      )}
      
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
      
      {!hasMeaningfulData && (
        <p className="text-xs text-amber-600 italic mt-2">
          Basic information only. Complete details unavailable.
        </p>
      )}
    </div>
  );
};

export default LegislatorDetails;
