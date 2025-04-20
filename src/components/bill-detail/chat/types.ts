
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatProps {
  content?: string | null;
  billText?: string | null;
}
