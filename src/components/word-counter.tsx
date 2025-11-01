"use client";

interface WordCounterProps {
  text: string;
  maxWords: number;
  onClear?: () => void;
}

export function WordCounter({ text, maxWords, onClear }: WordCounterProps) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > maxWords;

  return (
    <div className="flex items-center justify-between mt-2">
      <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
        {wordCount.toLocaleString()}/{maxWords.toLocaleString()} words
        {isOverLimit && ' (exceeds limit)'}
      </span>
      {text && onClear && (
        <button
          onClick={onClear}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
