
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message, ChatProps } from "./chat/types";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./chat/ChatMessages";
import ChatInput from "./chat/ChatInput";

const BillChat = ({ content, billText, isOpen, onClose }: ChatProps & { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const billContent = content || billText || "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !billContent) return;
    
    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const apiMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      
      apiMessages.push({
        role: "user" as const,
        content: inputMessage,
      });

      const { data, error } = await supabase.functions.invoke('chat-with-bill', {
        body: { 
          messages: apiMessages,
          billText: billContent 
        }
      });

      if (error) {
        console.error("Error invoking function:", error);
        throw new Error(`Error invoking function: ${error.message}`);
      }

      if (data.error) {
        console.error("Function returned error:", data.error);
        throw new Error(data.userMessage || data.error);
      }

      if (!data.response || !data.response.content) {
        throw new Error("Invalid response format from AI");
      }

      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: data.response.content }
      ]);
      
    } catch (error) {
      console.error("Error in chat:", error);
      toast.error(`Failed to get response: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if not open or no content
  if (!billContent || !isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 w-[350px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] bg-white border rounded-lg shadow-lg flex flex-col z-50"> 
      <ChatHeader onClose={onClose} />
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
};

export default BillChat;
