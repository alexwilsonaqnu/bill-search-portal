
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ShowMoreButtonProps {
  onClick: () => void;
  showingFullText?: boolean;
}

const ShowMoreButton = ({ onClick, showingFullText = false }: ShowMoreButtonProps) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="mt-4 w-full" 
      onClick={onClick}
    >
      {showingFullText ? (
        <>
          <ChevronUp size={16} className="mr-2" /> Show Less
        </>
      ) : (
        <>
          <ChevronDown size={16} className="mr-2" /> View Full Text
        </>
      )}
    </Button>
  );
};

export default ShowMoreButton;
