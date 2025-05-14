
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ChatHeaderProps } from "./types";

const ChatHeader = ({ onClose }: ChatHeaderProps) => {
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h2 className="font-semibold text-lg">Chat with Bill Assistant</h2>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatHeader;
