
import { Button } from "@/components/ui/button";

interface ShowMoreButtonProps {
  onClick: () => void;
}

const ShowMoreButton = ({ onClick }: ShowMoreButtonProps) => (
  <Button 
    variant="ghost" 
    size="sm" 
    className="mt-2" 
    onClick={onClick}
  >
    Show Full Text
  </Button>
);

export default ShowMoreButton;
