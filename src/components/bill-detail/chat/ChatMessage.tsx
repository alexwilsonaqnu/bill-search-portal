
import { Message } from "./types";
import { formatMessageContent } from "./messageFormatter";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] rounded-lg p-3 ${
          message.role === 'user' 
            ? 'bg-brand-primary text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.role === 'assistant' ? (
          <div 
            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
            className="chat-message-content"
          />
        ) : (
          message.content
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

