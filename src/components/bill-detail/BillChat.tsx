
import { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message, ChatProps } from "./chat/types";
import ChatMessage from "./chat/ChatMessage";
import LoadingIndicator from "./chat/LoadingIndicator";
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
        throw new Error(`Error invoking function: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
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

  if (!billContent) return null;

  return isOpen ? (
    <div className="w-[350px] bg-white border rounded-lg shadow-lg flex flex-col h-[500px]">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Chat with the Bill</h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

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

      <div className="border-t p-4">
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  ) : null;
};

export default BillChat;
