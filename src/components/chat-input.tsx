"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image"; 
import { ContextDialog } from "./context-dialog";


interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  selectedProvider: 'gemini' | 'openai'; 
}

export function ChatInput({ 
  onSendMessage, 
  isLoading = false,
  selectedProvider 
}: ChatInputProps) {
  
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  


  // Handle context change
  const handleContextChange = (newContext: string) => {
    setContext(newContext);
    localStorage.setItem('chat_context', newContext);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    
    <div className="p-4 bg-background"> 
      {/* --- CHANGE 1: 'flex items-end gap-2' YAHAN SE HATA DIA --- */}
      <div className="max-w-4xl mx-auto"> 
        
        {/* --- CHANGE 2: 'flex-1' YAHAN SE HATA DIA --- */}
        <div className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-[1.5px] animate-[background-pan_3s_linear_infinite] [background-size:200%_auto]">
          <div className="rounded-[14px] overflow-hidden bg-background">
            {/* Message Input Area */}
            <div className="p-4">
              <Input
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full border-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground"
              />
            </div>
            
          
            {/* Control Buttons Area (Sirf left side k controls) */}
            <div className=" p-3 flex items-center justify-between"> {/* 'justify-between' wapis add kar dia */}
              {/* Left Side - Control Buttons */}
              <div className="flex items-center gap-2">
                {/* Add Context Button */}
                <ContextDialog 
                  context={context}
                  onContextChange={handleContextChange}
                />
              </div>

              {/* --- CHANGE 4: Send Button wapis YAHAN ADD KAR DIA --- */}
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                size="icon" 
                // --- CHANGE 5: 'flex-shrink-0' hata dia, 'mr-1' add kia ---
                className="h-8 w-8 rounded-full bg-blue-200" 
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Image
                    src="/send-icon.png"
                    width={16}
                    height={16}
                    alt="Send"
                    className="brightness-75"
                  />
                )}
              </Button>
            </div>
            
          </div>
        </div>
        
        {/* --- Send Button yahan se HATA DIA --- */}
        
      </div>
    </div>
  );
}

