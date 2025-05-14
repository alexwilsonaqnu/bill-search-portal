
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLegislator } from "@/hooks/useLegislatorSimple";
import LegislatorDetails from "./LegislatorDetails";
import SponsorTooltip from "./SponsorTooltip";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";
import { clearLegislatorCache } from "@/services/legislator/simple";

interface SponsorHoverCardProps {
  sponsorData: any;
  getSponsorName: (sponsor: any) => string;
  legislatorId?: string;
}

const SponsorHoverCard = ({ sponsorData, getSponsorName, legislatorId }: SponsorHoverCardProps) => {
  const sponsorName = getSponsorName(sponsorData);
  const [isOpen, setIsOpen] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Log sponsor data for debugging
  useEffect(() => {
    console.log('SponsorHoverCard data:', { 
      sponsorName,
      legislatorId,
      sponsorData
    });
  }, [sponsorName, legislatorId, sponsorData]);
  
  // If we don't have a legislator ID or name, use a simpler tooltip
  if (!legislatorId && !sponsorName) {
    return <SponsorTooltip sponsorName={"Unknown Sponsor"} />;
  }
  
  // Using our new simplified hook
  const { data: legislatorInfo, isLoading, error, refetch } = useLegislator(
    isOpen ? legislatorId : undefined, 
    isOpen ? sponsorName : undefined,
    { forceRefresh }
  );

  // Reset forceRefresh after data is loaded
  useEffect(() => {
    if (!isLoading && forceRefresh) {
      setForceRefresh(false);
    }
  }, [isLoading, forceRefresh]);

  // Store debug info when data changes
  useEffect(() => {
    if (isOpen) {
      if (error) {
        console.error(`Error loading legislator: ${error.message}`);
        toast.error(`Unable to load information for ${sponsorName}`);
      } else if (!isLoading) {
        console.log('Legislator info loaded:', legislatorInfo);
        setDebugInfo({
          receivedAt: new Date().toISOString(),
          data: legislatorInfo
        });
      }
    }
  }, [legislatorInfo, isLoading, error, isOpen, sponsorName]);

  const handleRefresh = () => {
    // Clear the cache for this specific legislator
    const cacheKey = legislatorId ? `id:${legislatorId}` : `name:${sponsorName}`;
    clearLegislatorCache(cacheKey);
    console.log(`Clearing cache with key: ${cacheKey}`);
    
    setForceRefresh(true);
    refetch();
    toast.info(`Refreshing information for ${sponsorName}...`);
  };
  
  const handleDebugInfo = () => {
    console.log("Debug info:", {
      sponsorName,
      legislatorId,
      cachedInfo: debugInfo,
      forceRefresh,
      isLoading
    });
    
    toast.info(`Debug info logged to console`, { 
      description: `Check browser console for detailed information about ${sponsorName}` 
    });
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        className="cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => {
          console.log(`Popover opened for: ${sponsorName}`);
        }}
      >
        {sponsorName || "Unknown Sponsor"}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="flex flex-col space-y-3">
          <LegislatorDetails 
            legislatorInfo={legislatorInfo}
            isLoading={isLoading}
            error={error}
            sponsorName={sponsorName}
          />
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDebugInfo}
              className="text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              Debug
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoading || forceRefresh}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SponsorHoverCard;
