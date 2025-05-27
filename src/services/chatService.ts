
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/bill-detail/chat/types";

export interface ChatResponse {
  response: {
    content: string;
  };
}

export interface ChatError {
  error: string;
  userMessage?: string;
}

export async function sendChatMessage(
  messages: Message[], 
  billText: string
): Promise<ChatResponse> {
  console.log("Calling chat-with-bill edge function...", {
    messagesCount: messages.length,
    billTextLength: billText.length
  });

  const { data, error } = await supabase.functions.invoke('chat-with-bill', {
    body: { 
      messages,
      billText
    }
  });

  if (error) {
    console.error("Supabase function invocation error:", error);
    throw new Error(`Failed to call chat service: ${error.message}`);
  }

  if (data?.error) {
    console.error("Chat service returned error:", data);
    throw new Error(data.userMessage || data.error || "Failed to get AI response");
  }

  if (!data?.response?.content) {
    console.error("Invalid response format:", data);
    throw new Error("Invalid response format from chat service");
  }

  console.log("Successfully received chat response");
  return data as ChatResponse;
}
