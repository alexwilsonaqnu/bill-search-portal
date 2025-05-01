
import React from 'react';
import { Button } from "@/components/ui/button";

interface ShowMoreButtonProps {
  onClick: () => void;
}

const ShowMoreButton = ({ onClick }: ShowMoreButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="mt-2" 
      onClick={onClick}
    >
      Show Full Text
    </Button>
  );
};

export default ShowMoreButton;
