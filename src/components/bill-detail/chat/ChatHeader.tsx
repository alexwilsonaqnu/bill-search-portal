
import { MessageSquare, X } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader = ({ onClose }: ChatHeaderProps) => {
  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Chat with the Bill</h3>
      </div>
      <button 
        onClick={onClose} 
        className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
        aria-label="Close chat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChatHeader;
