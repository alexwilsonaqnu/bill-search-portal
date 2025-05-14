
import { useState, useRef, useEffect } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import { Message, ChatProps } from "./types";

export default function Chat({ billText, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I can help you understand this bill and answer any questions you have about it."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to the chat
    setMessages((prev) => [...prev, { role: "user", content: inputMessage }]);
    
    // Clear the input after sending
    const sentMessage = inputMessage;
    setInputMessage("");
    
    setIsLoading(true);
    try {
      // In a real implementation, we would call our AI service here
      // For now, just simulate a response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I'm analyzing your question about "${sentMessage.substring(0, 30)}${sentMessage.length > 30 ? '...' : ''}". This is a simulated response as the AI chat functionality is not fully implemented yet.`
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your request. Please try again later."
        }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader onClose={onClose || (() => console.log("Close not implemented"))} />
      <ChatMessages 
        messages={messages} 
        isLoading={isLoading} 
        messagesEndRef={messagesEndRef} 
      />
      <div className="border-t p-4">
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
