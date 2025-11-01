

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadingDots } from './loading-dots';


interface ChatMessageProps {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}


export function ChatMessage({ content, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
        isUser
          ? 'bg-blue-50 text-primary-foreground'
          : 'bg-white'
      }`}>
        {isUser ? (
          // User message
          <p className="text-sm whitespace-pre-wrap text-black">{content}</p>
        ) : (
          // Assistant message
          <div className="text-sm prose prose-sm max-w-none">
            

            {content ? (
               <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-gray-200 p-2 rounded text-xs font-mono overflow-x-auto">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-200 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              // Loading dots
              <div className="flex items-center">
                <LoadingDots className="text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}