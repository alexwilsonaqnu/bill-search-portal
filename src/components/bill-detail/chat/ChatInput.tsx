
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ChatInputProps } from "./types";

const ChatInput = ({ 
  inputMessage, 
  setInputMessage, 
  handleSendMessage, 
  isLoading 
}: ChatInputProps) => {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        placeholder="Ask a question about this bill..."
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button 
        type="submit" 
        disabled={isLoading || !inputMessage.trim()} 
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;
