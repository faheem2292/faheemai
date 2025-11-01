"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; 
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { MemoryBadge } from "@/components/memory-badge";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatHeader } from "@/components/chat-header";
import { NavRail } from "@/components/nav-rail"; // Naya NavRail component
import { MemoryStorageService } from "@/lib/memory-storage";
import { MemorySummarizationService } from "@/lib/memory-summarization";
import { TitleGenerationService } from "@/lib/title-generation";
import { ConversationMemory, ChatMessage as MemoryChatMessage } from "@/lib/memory-types";

// Simple message type (bina image URL k)
interface ChatMessageType {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<ConversationMemory | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  
  // State ko 'chat-input' se yahan move kar dia hai
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai'>('gemini');

  const memoryStorage = MemoryStorageService.getInstance();
  const summarizationService = MemorySummarizationService.getInstance();
  const titleGenerationService = TitleGenerationService.getInstance();

  // Provider state ko load karna
  useEffect(() => {
    const savedProvider = localStorage.getItem('selected_provider') as 'gemini' | 'openai' || 'gemini';
    setSelectedProvider(savedProvider);
  }, []);

  // Provider change handle karna (ab NavRail se call ho ga)
  const handleProviderChange = (provider: 'gemini' | 'openai') => {
    setSelectedProvider(provider);
    localStorage.setItem('selected_provider', provider); // Save bhi karein
  };

  // Conversation initialize karna
  useEffect(() => {
    const initializeConversation = () => {
      let conversation = memoryStorage.getCurrentConversation();

      if (!conversation) {
        const savedContext = localStorage.getItem('chat_context') || '';
        conversation = memoryStorage.createConversation(savedContext);
      } else {
        const latestContext = localStorage.getItem('chat_context') || '';
        if (latestContext !== conversation.context) {
          conversation.context = latestContext;
          memoryStorage.updateConversation(conversation);
        }
      }
      setCurrentConversation(conversation);
      const displayMessages: ChatMessageType[] = conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(displayMessages);
    };
    initializeConversation();
  }, [memoryStorage]);

  // Context changes ko listen karna
  useEffect(() => {
    const handleContextChange = () => {
      const latestContext = localStorage.getItem('chat_context') || '';
      setCurrentConversation(prevConversation => {
        if (prevConversation) {
          const updatedConversation = { ...prevConversation, context: latestContext };
          memoryStorage.updateConversation(updatedConversation);
          return updatedConversation;
        }
        return null;
      });
    };
    window.addEventListener('storage', handleContextChange);
    window.addEventListener('contextUpdated', handleContextChange);
    return () => {
      window.removeEventListener('storage', handleContextChange);
      window.removeEventListener('contextUpdated', handleContextChange);
    };
  }, [memoryStorage]);

  // Summarization handle karna
  const handleSummarization = async () => {
    const conversation = memoryStorage.getCurrentConversation();
    if (!conversation || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const { oldMessages, recentMessages } = memoryStorage.getMessagesForSummarization();
      if (oldMessages.length === 0) {
        setIsSummarizing(false);
        return;
      }
      const apiKey = selectedProvider === 'gemini'
        ? localStorage.getItem('gemini_api_key')
        : localStorage.getItem('openai_api_key');
      if (!apiKey) {
         setMessages(prev => [...prev, { id: Date.now().toString(), content: `Cannot summarize: Please add your ${selectedProvider} API key.`, isUser: false, timestamp: new Date() }]);
        setIsSummarizing(false);
        return;
      }
      const result = await summarizationService.summarizeConversation(oldMessages, conversation.context, apiKey, selectedProvider);
      const updatedConversation = {
        ...conversation,
        summary: result.summary,
        messages: [...recentMessages],
        totalWords: result.totalWords + recentMessages.reduce((sum, msg) => sum + (msg.content?.split(/\s+/).length || 0), 0),
        lastSummarizedAt: new Date(),
        isSummarizing: false
      };
      memoryStorage.updateConversation(updatedConversation);
      setCurrentConversation(updatedConversation);
      const displayMessages: ChatMessageType[] = recentMessages.map(msg => ({
        id: msg.id, content: msg.content, isUser: msg.isUser, timestamp: new Date(msg.timestamp)
      }));
      setMessages(displayMessages);
    } catch (error) {
       setMessages(prev => [...prev, { id: Date.now().toString(), content: `Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, isUser: false, timestamp: new Date() }]);
      console.error('Summarization failed:', error);
    } finally {
      setIsSummarizing(false);
      setCurrentConversation(prev => prev ? {...prev, isSummarizing: false} : null);
    }
  };

  // Title generate karna
  const generateTitle = async (firstMessage: string) => {
    const conversation = memoryStorage.getCurrentConversation();
    if (!conversation || conversation.title !== 'New Chat' || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    try {
      const apiKey = selectedProvider === 'gemini'
        ? localStorage.getItem('gemini_api_key')
        : localStorage.getItem('openai_api_key');
      let title = conversation.title;
      if (apiKey) {
          title = await titleGenerationService.generateTitle(firstMessage, apiKey, selectedProvider);
      } else {
           setMessages(prev => [...prev, { id: Date.now().toString(), content: `Cannot generate title: API key not set. Using fallback.`, isUser: false, timestamp: new Date() }]);
           title = await titleGenerationService.generateTitle(firstMessage, '', ''); // Fallback
      }
      memoryStorage.updateConversationTitle(conversation.id, title);
      setCurrentConversation(prev => prev ? { ...prev, title: title } : null);
      setSidebarRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Title generation failed:', error);
       setMessages(prev => [...prev, { id: Date.now().toString(), content: `Title generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, isUser: false, timestamp: new Date() }]);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // New Chat
  const handleNewChat = () => {
    const savedContext = localStorage.getItem('chat_context') || '';
    const newConversation = memoryStorage.createConversation(savedContext);
    setCurrentConversation(newConversation);
    setMessages([]);
    setIsSidebarOpen(false);
    setSidebarRefreshTrigger(prev => prev + 1);
  };

  // Conversation select karna
  const handleConversationSelect = (conversation: ConversationMemory) => {
    const selectedConv = memoryStorage.switchToConversation(conversation.id);
    if (selectedConv) {
        setCurrentConversation(selectedConv);
        const displayMessages: ChatMessageType[] = selectedConv.messages.map(msg => ({
          id: msg.id, content: msg.content, isUser: msg.isUser, timestamp: new Date(msg.timestamp)
        }));
        setMessages(displayMessages);
        setIsSidebarOpen(false);
    } else {
        console.error("Failed to switch conversation, ID not found:", conversation.id);
        handleNewChat();
    }
  };

  // Conversation delete karna
  const handleConversationDelete = (conversationId: string) => {
    const isCurrent = currentConversation?.id === conversationId;
    memoryStorage.deleteConversation(conversationId);
    if (isCurrent) {
      handleNewChat();
    } else {
      setSidebarRefreshTrigger(prev => prev + 1);
    }
  };

  // Conversation rename karna
  const handleConversationRename = (conversationId: string, newTitle: string) => {
    memoryStorage.updateConversationTitle(conversationId, newTitle);
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
    }
    setSidebarRefreshTrigger(prev => prev + 1);
  };

  // Message bhejna (Simple version)
  const handleSendMessage = async (message: string) => {
    let currentConv = memoryStorage.getCurrentConversation();
    if (!currentConv) {
       const savedContext = localStorage.getItem('chat_context') || '';
       currentConv = memoryStorage.createConversation(savedContext);
       setCurrentConversation(currentConv);
       setSidebarRefreshTrigger(prev => prev + 1);
    }

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    const memoryUserMessage: MemoryChatMessage = { ...userMessage };
    const isFirstMessage = currentConv.messages.length === 0;

    memoryStorage.addMessage(memoryUserMessage);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    if (isFirstMessage) {
      await generateTitle(message);
    }
    
    currentConv = memoryStorage.getCurrentConversation();
    if (currentConv) setCurrentConversation(currentConv);

    try {
      if (memoryStorage.needsSummarization()) {
        await handleSummarization();
      }
      
      const chatApiKey = selectedProvider === 'gemini'
        ? localStorage.getItem('gemini_api_key')
        : localStorage.getItem('openai_api_key');

      if (!chatApiKey) {
        const errorMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          content: `Please add your ${selectedProvider} API key in the settings dialog.`,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessagePlaceholder: ChatMessageType = {
        id: aiMessageId,
        content: '',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessagePlaceholder]);

      const conversationForAPI = memoryStorage.getCurrentConversation();
      const latestContext = localStorage.getItem('chat_context') || '';
      let fullContext = latestContext || conversationForAPI?.context || '';

      if (conversationForAPI?.summary) {
        fullContext += `\n\nPrevious conversation summary:\n${conversationForAPI.summary}`;
      }

      if (conversationForAPI?.messages && conversationForAPI.messages.length > 0) {
        const historyMessages = conversationForAPI.messages.slice(0, -1); 
        if (historyMessages.length > 0) {
          const conversationHistory = historyMessages
            .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n');
          fullContext += `\n\nRecent conversation history:\n${conversationHistory}`;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: fullContext,
          apiKey: chatApiKey,
          selectedProvider: selectedProvider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: `Error: ${errorData.error || response.statusText}` }
            : msg
        ));
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.error) {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: `Error: ${data.error}` }
            : msg
        ));
      } else {
        const finalContent = data.message || "";
        const words = finalContent.split(/(\s+)/);
        let currentContent = '';
        for (let i = 0; i < words.length; i++) {
          currentContent += words[i];
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: currentContent }
              : msg
          ));
          await new Promise(resolve => setTimeout(resolve, Math.min(50, 500 / words.length)));
        }
         setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: finalContent } : msg
         ));
        const memoryAiMessage: MemoryChatMessage = {
          id: aiMessageId,
          content: finalContent,
          isUser: false,
          timestamp: new Date()
        };
        memoryStorage.addMessage(memoryAiMessage);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorContent = error instanceof Error ? error.message : 'An unexpected error occurred.';
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: `Failed to process message: ${errorContent}`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentConversation(memoryStorage.getCurrentConversation());
    }
  };


  return (
    <div className="h-screen flex flex-row bg-background w-full">
      
      {/* Nav Rail (Vertical Bar) */}
      <NavRail
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
        selectedProvider={selectedProvider}
        onProviderChange={handleProviderChange}
      />

      {/* Chat History Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentConversationId={currentConversation?.id || null}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onConversationDelete={handleConversationDelete}
        onConversationRename={handleConversationRename}
        refreshTrigger={sidebarRefreshTrigger}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <ChatHeader
          currentConversation={currentConversation}
          isGeneratingTitle={isGeneratingTitle}
        />

        {/* Memory Badge */}
        <MemoryBadge
          isSummarizing={isSummarizing}
          totalWords={currentConversation?.totalWords || 0}
          maxWords={262144}
        />

        {/* Chat Messages Area */}
        <div key={currentConversation?.id || 'no-conv'} className="flex-1 p-6 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            
            // --- YE HAI CLEAN PLACEHOLDER ---
            // Red box hata dia hai
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-100 dark:opacity-5 pointer-events-none">
              <Image
                src="/bg-bolt.png" // <-- File ka naam yahan check karein
                width={200}
                height={200}
                alt="Chat Placeholder"
                priority
              />
            </div>
            // --- END PLACEHOLDER ---

          ) : (
            // Messages list
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))}
            </div>
          )}
        </div>

        {/* Message Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedProvider={selectedProvider}
        />
      </div>
    </div>
  );
}

