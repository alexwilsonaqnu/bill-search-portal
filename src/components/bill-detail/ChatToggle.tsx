
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

const ChatToggle = ({ onClick, isOpen }: ChatToggleProps) => {
  return (
    <Button
      variant={isOpen ? "secondary" : "default"}
      size="sm"
      className={`shadow-md flex items-center ${isOpen ? 'bg-gray-100 hover:bg-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      onClick={onClick}
      aria-label={isOpen ? "Close chat" : "Chat with bill"}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {isOpen ? "Close Chat" : "Chat with Bill"}
    </Button>
  );
};

export default ChatToggle;
