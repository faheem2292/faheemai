"use client";

import { useState, useEffect } from "react";

interface MemoryBadgeProps {
  isSummarizing: boolean;
  totalWords: number;
  maxWords: number;
}

export function MemoryBadge({ isSummarizing, totalWords, maxWords }: MemoryBadgeProps) {
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (isSummarizing) {
      setShowBadge(true);
    } else {
      // Hide badge after a short delay when summarization is complete
      const timer = setTimeout(() => setShowBadge(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSummarizing]);

  if (!showBadge) return null;

  const percentage = Math.round((totalWords / maxWords) * 100);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-all duration-300 ${
        isSummarizing 
          ? 'bg-blue-500 text-white animate-pulse' 
          : 'bg-green-500 text-white'
      }`}>
        {isSummarizing ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <span>Summarizing conversation...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Memory optimized</span>
          </div>
        )}
      </div>
      
      {/* Memory usage indicator */}
      <div className="mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
        Memory: {totalWords.toLocaleString()}/{maxWords.toLocaleString()} words ({percentage}%)
      </div>
    </div>
  );
}
