
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
}

const ChatInput = ({ 
  inputMessage, 
  setInputMessage, 
  handleSendMessage, 
  isLoading 
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex space-x-2">
      <Textarea
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about this bill..."
        className="resize-none min-h-[60px]"
        disabled={isLoading}
      />
      <Button 
        onClick={handleSendMessage}
        disabled={isLoading || !inputMessage.trim()}
        size="icon"
        className="h-[60px] bg-brand-primary hover:bg-brand-primary/90"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ChatInput;
