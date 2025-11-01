"use client";

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = "" }: LoadingDotsProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
