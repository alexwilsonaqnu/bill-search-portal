
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface SponsorTooltipProps {
  sponsorName: string;
}

const SponsorTooltip = ({ sponsorName }: SponsorTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="cursor-pointer hover:text-blue-600 transition-colors">
          {sponsorName || "Unknown Sponsor"}
        </TooltipTrigger>
        <TooltipContent>
          No additional information available
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SponsorTooltip;
