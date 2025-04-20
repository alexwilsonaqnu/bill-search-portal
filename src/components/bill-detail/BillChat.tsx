import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BillChatProps {
  billText: string | null;
}

const BillChat = ({ billText }: BillChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !billText) return;
    
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
          billText: billText 
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    if (!content) return "";

    const hasBullets = content.includes("- ") || content.includes("* ");
    
    if (hasBullets) {
      const lines = content.split("\n");
      let inList = false;
      let formattedContent = "";
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
          if (!inList) {
            formattedContent += "<ul class='list-disc pl-5 my-2'>";
            inList = true;
          }
          formattedContent += `<li>${trimmedLine.substring(2)}</li>`;
        } else {
          if (inList) {
            formattedContent += "</ul>";
            inList = false;
          }
          if (trimmedLine) {
            formattedContent += `<p class='mb-2'>${trimmedLine}</p>`;
          } else {
            formattedContent += "<br />";
          }
        }
      });
      
      if (inList) {
        formattedContent += "</ul>";
      }
      
      return formattedContent;
    }
    
    return content.split("\n").map(line => 
      line.trim() ? `<p class='mb-2'>${line}</p>` : "<br />"
    ).join("");
  };

  if (!billText) return null;

  return (
    <Sidebar className="fixed right-0 top-0 border-l z-30 bg-background">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Chat with the Bill</h3>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto p-4">
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
                  {msg.role === 'assistant' ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                      className="chat-message-content"
                    />
                  ) : (
                    msg.content
                  )}
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
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
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
      </SidebarFooter>
    </Sidebar>
  );
};

export default BillChat;
