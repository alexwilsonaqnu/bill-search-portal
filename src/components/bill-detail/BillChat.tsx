
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BillChatProps {
  billText: string | null;
}

const BillChat = ({ billText }: BillChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !billText) return;
    
    // Add user message to chat
    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Format messages for OpenAI API
      const apiMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      
      apiMessages.push({
        role: "user" as const,
        content: inputMessage,
      });

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('chat-with-bill', {
        body: { 
          messages: apiMessages,
          billText: billText 
        }
      });

      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response to chat
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!billText) return null;

  return (
    <div className="fixed bottom-10 right-10 z-10">
      {!isOpen ? (
        <Button 
          onClick={toggleChat} 
          size="lg" 
          className="rounded-full shadow-lg h-auto p-4 flex flex-col items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs font-medium">Ask this bill questions</span>
        </Button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col border">
          <div className="flex justify-between items-center p-4 border-b bg-brand-primary text-white">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              <h3 className="font-semibold">Chat with the Bill</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleChat} 
              className="h-8 w-8 p-0 text-white hover:bg-brand-primary/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 max-h-96 min-h-[300px]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50 text-brand-primary" />
                <p>Ask questions about this bill and get AI-powered answers.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-brand-primary text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce delay-75"></div>
                        <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default BillChat;
