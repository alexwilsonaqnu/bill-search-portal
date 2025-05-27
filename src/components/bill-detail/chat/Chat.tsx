
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { sendChatMessage } from "@/services/chatService";
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
    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear the input after sending
    setInputMessage("");
    
    setIsLoading(true);
    
    try {
      // Create the messages array for the API call
      const apiMessages = [...messages, userMessage];
      
      // Call the chat service
      const response = await sendChatMessage(apiMessages, billText || "");
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.response.content
        }
      ]);
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm sorry, I encountered an error while processing your request: ${errorMessage}. Please try again later.`
        }
      ]);
      
      // Show toast notification
      toast.error(`Chat error: ${errorMessage}`);
    } finally {
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
