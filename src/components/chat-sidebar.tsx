"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ConversationMemory } from "@/lib/memory-types";

import { Plus, Search, X, MessageSquare } from "lucide-react";
import { ChatListItem } from "./chat-list-item";
import { MemoryStorageService } from "@/lib/memory-storage";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string | null;
  onConversationSelect: (conversation: ConversationMemory) => void;
  onNewChat: () => void;
  onConversationDelete: (conversationId: string) => void;
  onConversationRename: (conversationId: string, newTitle: string) => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export function ChatSidebar({
  isOpen,
  onClose,
  currentConversationId,
  onConversationSelect,
  onNewChat,
  onConversationDelete,
  onConversationRename,
  refreshTrigger
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ConversationMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<ConversationMemory[]>([]);
  
  const memoryStorage = MemoryStorageService.getInstance();

  // Load conversations from storage
  useEffect(() => {
    const loadConversations = () => {
      const allConversations = memoryStorage.getAllConversations();
      setConversations(allConversations);
      setFilteredConversations(allConversations);
    };

    loadConversations();
    
    // Listen for storage changes (when new conversations are added or titles are updated)
    const handleStorageChange = () => {
      loadConversations();
    };

    // Listen for custom title update events
    const handleTitleUpdate = () => {
      loadConversations();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('titleUpdated', handleTitleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('titleUpdated', handleTitleUpdate);
    };
  }, [memoryStorage]);

  // Refresh conversations when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      const allConversations = memoryStorage.getAllConversations();
      setConversations(allConversations);
      setFilteredConversations(allConversations);
    }
  }, [refreshTrigger, memoryStorage]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const handleConversationSelect = (conversationId: string) => {
    const conversation = memoryStorage.switchToConversation(conversationId);
    if (conversation) {
      onConversationSelect(conversation);
    }
  };

  const handleDelete = (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      memoryStorage.deleteConversation(conversationId);
      onConversationDelete(conversationId);
      
      // Reload conversations
      const allConversations = memoryStorage.getAllConversations();
      setConversations(allConversations);
      setFilteredConversations(allConversations);
    }
  };

  const handleRename = (conversationId: string, newTitle: string) => {
    memoryStorage.updateConversationTitle(conversationId, newTitle);
    onConversationRename(conversationId, newTitle);
    
    // Reload conversations
    const allConversations = memoryStorage.getAllConversations();
    setConversations(allConversations);
    setFilteredConversations(allConversations);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:z-auto">
      {/* Backdrop for mobile */}
      <div 
        className="absolute inset-0 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute left-0 top-0 h-full w-80 bg-background border-r flex flex-col lg:relative lg:translate-x-0">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* New Chat Button */}
          <Button 
            onClick={onNewChat}
            className="w-full mb-4"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-xs mt-1">
                {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <ChatListItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === currentConversationId}
                  onSelect={handleConversationSelect}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{conversations.length} conversations</span>
            <span>{memoryStorage.getMemoryStats().totalWords.toLocaleString()} words</span>
          </div>
        </div>
      </div>
    </div>
  );
}
