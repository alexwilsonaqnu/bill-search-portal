
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ShowMoreButtonProps {
  onClick: () => void;
}

const ShowMoreButton = ({ onClick }: ShowMoreButtonProps) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="mt-4 flex items-center gap-1" 
      onClick={onClick}
    >
      <ChevronDown className="h-4 w-4" />
      View Full Text
    </Button>
  );
};

export default ShowMoreButton;
