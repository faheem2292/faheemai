"use client";

import { ConversationMemory } from "@/lib/memory-types";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

interface ChatListItemProps {
  conversation: ConversationMemory;
  isActive: boolean;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onRename: (conversationId: string, newTitle: string) => void;
}

export function ChatListItem({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete, 
  onRename 
}: ChatListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [showMenu, setShowMenu] = useState(false);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-muted'
      }`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              aria-label="Edit conversation title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              className="w-full bg-transparent border-none outline-none text-sm font-medium"
              autoFocus
              placeholder="Enter new title"
            />
          ) : (
            <div 
              className="text-sm font-medium truncate"
              onDoubleClick={() => setIsEditing(true)}
            >
              {conversation.title}
            </div>
          )}
          
          {conversation.lastMessagePreview && (
            <div className={`text-xs mt-1 truncate ${
              isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              {conversation.lastMessagePreview}
            </div>
          )}
          
          <div className={`text-xs mt-1 ${
            isActive ? 'text-primary-foreground/50' : 'text-muted-foreground'
          }`}>
            {formatTime(conversation.updatedAt)}
            {conversation.totalWords > 0 && (
              <span className="ml-2">• {conversation.totalWords.toLocaleString()} words</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-2 top-8 bg-background border rounded-md shadow-lg z-10 min-w-[120px]">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
              setShowMenu(false);
            }}
          >
            <Trash2 className="h-3 w-3 mr-2" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
