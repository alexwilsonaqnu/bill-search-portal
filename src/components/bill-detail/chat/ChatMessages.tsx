
import { MessageSquare } from "lucide-react";
import { Message } from "./types";
import ChatMessage from "./ChatMessage";
import LoadingIndicator from "./LoadingIndicator";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, isLoading, messagesEndRef }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50 text-brand-primary" />
          <p>Ask questions about this bill and get AI-powered answers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
