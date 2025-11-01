export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ConversationMemory {
  id: string;
  title: string;
  messages: ChatMessage[];
  summary?: string;
  context: string;
  lastSummarizedAt?: Date;
  totalWords: number;
  isSummarizing: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview: string;
}

export interface MemoryStorage {
  conversations: Record<string, ConversationMemory>;
  currentConversationId: string | null;
}

export interface SummarizationRequest {
  messages: ChatMessage[];
  context: string;
  maxWords: number;
}

export interface SummarizationResponse {
  summary: string;
  preservedMessages: ChatMessage[];
  totalWords: number;
}
