"use client";

import { SettingsDialog } from "./settings-dialog";
import { SidebarToggle } from "./sidebar-toggle";
// --- 1. 'Plus' ko yahan se hata dein ---
// import { Plus } from "lucide-react"; 
import Image from "next/image"; // <-- 2. 'Image' ko import karein
import { Button } from "@/components/ui/button";

interface NavRailProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedProvider: 'gemini' | 'openai';
  onProviderChange: (provider: 'gemini' | 'openai') => void;
}

export function NavRail({ 
  isSidebarOpen, 
  onToggleSidebar, 
  onNewChat,
  selectedProvider,
  onProviderChange
}: NavRailProps) {
  return (
    // Ye hai "vertical border" (Nav Rail)
    // Dark background k liye "bg-muted" use kia hai
    <div className="h-full w-16 flex flex-col justify-between items-center p-3 bg-blue-100 border-r border-border">
      
      {/* Top Icons */}
      <div className="flex flex-col gap-3">
        {/* Ye Chat History wala toggle button hai */}
        <SidebarToggle 
          isOpen={isSidebarOpen}
          onToggle={onToggleSidebar}
        />
        {/* New Chat Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={onNewChat}
        >
          {/* --- 3. YAHAN CHANGE KIA HAI --- */}
          {/* <Plus className="h-4 w-4" /> */}
          <Image
            src="/new-chat.png" // <-- APNI FILE KA NAAM YAHAN LIKHEIN
            width={16} // h-4 = 16px
            height={16} // w-4 = 16px
            alt="New Chat"
          />
          {/* --- END CHANGE --- */}
        </Button>
      </div>

      {/* Bottom Icon (Settings) */}
      <div>
        {/* Settings button yahan move kar dia hai */}
        <SettingsDialog 
          selectedProvider={selectedProvider}
          onProviderChange={onProviderChange}
        />
      </div>
    </div>
  );
}
