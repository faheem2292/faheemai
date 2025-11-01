"use client";

export class TitleGenerationService {
  private static instance: TitleGenerationService;
  
  private constructor() {}
  
  public static getInstance(): TitleGenerationService {
    if (!TitleGenerationService.instance) {
      TitleGenerationService.instance = new TitleGenerationService();
    }
    return TitleGenerationService.instance;
  }

  // Generate title for conversation based on first message
  public async generateTitle(
    firstMessage: string,
    apiKey: string,
    selectedProvider: string
  ): Promise<string> {
    if (!firstMessage.trim()) {
      return this.generateFallbackTitle();
    }

    try {
      const titlePrompt = this.createTitlePrompt(firstMessage);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: titlePrompt,
          context: '', // No additional context for title generation
          apiKey: apiKey,
          selectedProvider: selectedProvider
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate title');
      }

      const data = await response.json();
      const generatedTitle = data.message.trim();

      // Validate and clean the title
      return this.cleanTitle(generatedTitle);
    } catch (error) {
      console.error('Title generation error:', error);
      return this.generateFallbackTitle(firstMessage);
    }
  }

  // Create title generation prompt
  private createTitlePrompt(firstMessage: string): string {
    return `Based on this first message, generate a concise chat title (maximum 5 words) that captures the main topic or intent. 

Examples of good titles:
- "Weather Forecast" (for weather questions)
- "Code Debugging Help" (for programming issues)
- "Recipe Ideas" (for cooking questions)
- "Travel Planning" (for travel advice)
- "Math Problem" (for math questions)
- "General Chat" (for casual conversation)

First message: "${firstMessage}"

Respond with ONLY the title, no additional text.`;
  }

  // Clean and validate generated title
  private cleanTitle(title: string): string {
    // Remove quotes, extra whitespace, and limit length
    let cleaned = title.replace(/['"]/g, '').trim();
    
    // Remove common prefixes/suffixes
    cleaned = cleaned.replace(/^(title:|chat title:|title is:)/i, '').trim();
    
    // Limit to 5 words
    const words = cleaned.split(/\s+/);
    if (words.length > 5) {
      cleaned = words.slice(0, 5).join(' ');
    }
    
    // Ensure minimum length
    if (cleaned.length < 3) {
      return this.generateFallbackTitle();
    }
    
    return cleaned;
  }

  // Generate fallback title
  private generateFallbackTitle(firstMessage?: string): string {
    if (firstMessage && firstMessage.length > 0) {
      // Use first 30 characters of message
      const truncated = firstMessage.substring(0, 30).trim();
      return truncated.length > 0 ? truncated : 'New Chat';
    }
    
    // Generate timestamp-based title
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `Chat at ${timeStr}`;
  }

  // Generate title for existing conversation (if title is missing)
  public async generateTitleForExisting(): Promise<string> {
    // This would be used to generate titles for conversations that don't have them
    // For now, return a fallback
    return this.generateFallbackTitle();
  }
}
