"use client";

import { ConversationMemory, MemoryStorage, ChatMessage } from './memory-types';

const STORAGE_KEY = 'chat_memory';
const MAX_WORDS_THRESHOLD = 200000; // 80% of 262,144 limit
const RECENT_MESSAGES_TO_KEEP = 15; // Keep last 15 messages when summarizing

export class MemoryStorageService {
  private static instance: MemoryStorageService;
  
  private constructor() {}
  
  public static getInstance(): MemoryStorageService {
    if (!MemoryStorageService.instance) {
      MemoryStorageService.instance = new MemoryStorageService();
    }
    return MemoryStorageService.instance;
  }

  // Get all conversations from localStorage
  private getStorage(): MemoryStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { conversations: {}, currentConversationId: null };
    } catch (error) {
      console.error('Error reading memory storage:', error);
      return { conversations: {}, currentConversationId: null };
    }
  }

  // Save conversations to localStorage
  private saveStorage(storage: MemoryStorage): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Error saving memory storage:', error);
    }
  }

  // Create a new conversation
  public createConversation(context: string = ''): ConversationMemory {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: ConversationMemory = {
      id,
      title: 'New Chat',
      messages: [],
      context,
      totalWords: 0,
      isSummarizing: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessagePreview: ''
    };

    const storage = this.getStorage();
    storage.conversations[id] = conversation;
    storage.currentConversationId = id;
    this.saveStorage(storage);

    return conversation;
  }

  // Get current conversation
  public getCurrentConversation(): ConversationMemory | null {
    const storage = this.getStorage();
    if (!storage.currentConversationId) return null;
    return storage.conversations[storage.currentConversationId] || null;
  }

  // Add message to current conversation
  public addMessage(message: ChatMessage): void {
    const storage = this.getStorage();
    const conversation = this.getCurrentConversation();
    
    if (!conversation) return;

    conversation.messages.push(message);
    conversation.totalWords = this.calculateWordCount(conversation);
    conversation.updatedAt = new Date();
    conversation.lastMessagePreview = this.getLastMessagePreview(conversation);
    
    storage.conversations[conversation.id] = conversation;
    this.saveStorage(storage);
  }

  // Update conversation title
  public updateConversationTitle(conversationId: string, title: string): void {
    const storage = this.getStorage();
    const conversation = storage.conversations[conversationId];
    
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
      storage.conversations[conversationId] = conversation;
      this.saveStorage(storage);
    }
  }

  // Switch to a different conversation
  public switchToConversation(conversationId: string): ConversationMemory | null {
    const storage = this.getStorage();
    const conversation = storage.conversations[conversationId];
    
    if (conversation) {
      storage.currentConversationId = conversationId;
      this.saveStorage(storage);
      return conversation;
    }
    
    return null;
  }

  // Get last message preview for conversation
  private getLastMessagePreview(conversation: ConversationMemory): string {
    if (conversation.messages.length === 0) return '';
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage.content.substring(0, 50);
    return preview.length < lastMessage.content.length ? preview + '...' : preview;
  }

  // Update conversation (for summarization)
  public updateConversation(conversation: ConversationMemory): void {
    const storage = this.getStorage();
    conversation.updatedAt = new Date();
    storage.conversations[conversation.id] = conversation;
    this.saveStorage(storage);
  }

  // Check if conversation needs summarization
  public needsSummarization(): boolean {
    const conversation = this.getCurrentConversation();
    if (!conversation) return false;
    
    return conversation.totalWords >= MAX_WORDS_THRESHOLD && !conversation.isSummarizing;
  }

  // Get messages for summarization (keep recent messages)
  public getMessagesForSummarization(): { oldMessages: ChatMessage[], recentMessages: ChatMessage[] } {
    const conversation = this.getCurrentConversation();
    if (!conversation) return { oldMessages: [], recentMessages: [] };

    const messages = conversation.messages;
    const recentMessages = messages.slice(-RECENT_MESSAGES_TO_KEEP);
    const oldMessages = messages.slice(0, -RECENT_MESSAGES_TO_KEEP);

    return { oldMessages, recentMessages };
  }

  // Calculate word count for conversation
  private calculateWordCount(conversation: ConversationMemory): number {
    const allText = [
      conversation.context,
      ...conversation.messages.map(msg => msg.content),
      conversation.summary || ''
    ].join(' ');
    
    return allText.trim() ? allText.trim().split(/\s+/).length : 0;
  }

  // Get all conversations
  public getAllConversations(): ConversationMemory[] {
    const storage = this.getStorage();
    return Object.values(storage.conversations)
      .map(conv => ({
        ...conv,
        title: conv.title || 'Untitled Chat',
        lastMessagePreview: conv.lastMessagePreview || ''
      }))
      .sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  // Delete conversation
  public deleteConversation(id: string): void {
    const storage = this.getStorage();
    delete storage.conversations[id];
    
    if (storage.currentConversationId === id) {
      storage.currentConversationId = null;
    }
    
    this.saveStorage(storage);
  }

  // Clear all memory
  public clearAllMemory(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Get memory usage stats
  public getMemoryStats(): { totalConversations: number, totalWords: number, currentWords: number } {
    const conversations = this.getAllConversations();
    const current = this.getCurrentConversation();
    
    return {
      totalConversations: conversations.length,
      totalWords: conversations.reduce((sum, conv) => sum + conv.totalWords, 0),
      currentWords: current?.totalWords || 0
    };
  }
}
