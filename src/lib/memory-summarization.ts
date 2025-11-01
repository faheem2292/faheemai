"use client";

import { ChatMessage, SummarizationResponse } from './memory-types';

export class MemorySummarizationService {
  private static instance: MemorySummarizationService;
  
  private constructor() {}
  
  public static getInstance(): MemorySummarizationService {
    if (!MemorySummarizationService.instance) {
      MemorySummarizationService.instance = new MemorySummarizationService();
    }
    return MemorySummarizationService.instance;
  }

  // Summarize conversation messages
  public async summarizeConversation(
    messages: ChatMessage[],
    context: string,
    apiKey: string,
    selectedProvider: string
  ): Promise<SummarizationResponse> {
    if (messages.length === 0) {
      return {
        summary: '',
        preservedMessages: [],
        totalWords: 0
      };
    }

    // Create summarization prompt
    const summarizationPrompt = this.createSummarizationPrompt(messages, context);
    
    try {
      // Send to LLM for summarization
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: summarizationPrompt,
          context: '', // No additional context for summarization
          apiKey: apiKey,
          selectedProvider: selectedProvider
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize conversation');
      }

      const data = await response.json();
      const summary = data.message;

      // Calculate word count
      const totalWords = this.calculateWordCount(summary);

      return {
        summary,
        preservedMessages: messages.slice(-15), // Keep last 15 messages
        totalWords
      };
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to summarize conversation');
    }
  }

  // Create summarization prompt
  private createSummarizationPrompt(messages: ChatMessage[], context: string): string {
    const conversationText = messages.map(msg => 
      `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    return `Please summarize this conversation history while preserving key details and maintaining context for future responses. Focus on:

1. Important decisions, preferences, and key information shared
2. User's specific requirements or constraints mentioned
3. Any important context or background information
4. The overall flow and progression of the conversation
5. Any technical details or specific instructions given

Keep the summary concise but comprehensive. This summary will be used to maintain context in future conversations.

${context ? `\nUser Context: ${context}\n` : ''}

Conversation to summarize:
${conversationText}

Please provide a clear, well-structured summary that captures the essential information while being concise.`;
  }

  // Calculate word count
  private calculateWordCount(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  // Check if messages need summarization based on word count
  public shouldSummarize(messages: ChatMessage[], context: string, threshold: number = 200000): boolean {
    const allText = [
      context,
      ...messages.map(msg => msg.content)
    ].join(' ');
    
    const wordCount = this.calculateWordCount(allText);
    return wordCount >= threshold;
  }

  // Get conversation preview for UI
  public getConversationPreview(messages: ChatMessage[], maxLength: number = 100): string {
    if (messages.length === 0) return 'No messages yet';
    
    const lastMessage = messages[messages.length - 1];
    const preview = lastMessage.content.substring(0, maxLength);
    
    return lastMessage.isUser 
      ? `You: ${preview}${lastMessage.content.length > maxLength ? '...' : ''}`
      : `Assistant: ${preview}${lastMessage.content.length > maxLength ? '...' : ''}`;
  }
}
