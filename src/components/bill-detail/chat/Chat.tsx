
import { useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import { Message } from "./types";

export default function Chat({ content, billText }: { content?: string | null; billText?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I can help you understand this bill and answer any questions you have about it."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const addMessage = async (message: string) => {
    // Add user message to the chat
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    
    setLoading(true);
    try {
      // In a real implementation, we would call our AI service here
      // For now, just simulate a response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I'm analyzing your question about "${message.substring(0, 30)}...". This is a simulated response as the AI chat functionality is not fully implemented yet.`
          }
        ]);
        setLoading(false);
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
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <ChatMessages messages={messages} loading={loading} />
      <ChatInput onSendMessage={addMessage} disabled={loading} />
    </div>
  );
}
