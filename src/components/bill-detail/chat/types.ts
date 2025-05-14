
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatProps {
  content?: string | null;
  billText?: string | null;
  onClose?: () => void;
}

export interface ChatHeaderProps {
  onClose: () => void;
}

export interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
}
