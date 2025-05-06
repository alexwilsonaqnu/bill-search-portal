
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

const ChatToggle = ({ onClick, isOpen }: ChatToggleProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-white shadow-md hover:bg-gray-50"
      onClick={onClick}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {isOpen ? "Close Chat" : "Chat with Bill"}
    </Button>
  );
};

export default ChatToggle;
