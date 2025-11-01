"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Paperclip, Upload } from "lucide-react";
import { WordCounter } from "./word-counter";

interface ContextDialogProps {
  context: string;
  onContextChange: (context: string) => void;
}

const MAX_WORDS = 262144; // Based on Gemini 1.5 Flash context window (1,048,576 tokens / 4 tokens per word)

export function ContextDialog({ context, onContextChange }: ContextDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localContext, setLocalContext] = useState(context);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOverLimit = localContext.trim() ? localContext.trim().split(/\s+/).length > MAX_WORDS : false;

  const handleSave = () => {
    if (!isOverLimit) {
      onContextChange(localContext);
      setIsOpen(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('contextUpdated'));
    }
  };

  const handleCancel = () => {
    setLocalContext(context); // Reset to original context
    setIsOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    try {
      // Client-side PDF parsing using pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      
      // Use local worker file
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item) => {
            // Check if the item has a 'str' property (TextItem)
            if ('str' in item && typeof item.str === 'string') {
              return item.str;
            }
            return '';
          })
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      // Remove extra blank lines and normalize whitespace
      const cleanedText = fullText
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
        .trim();

      setLocalContext(prev => {
        const newText = prev ? `${prev}\n\n${cleanedText}` : cleanedText;
        const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
        
        if (words > MAX_WORDS) {
          // Truncate to fit within word limit
          const wordsArray = newText.trim().split(/\s+/);
          return wordsArray.slice(0, MAX_WORDS).join(' ');
        }
        
        return newText;
      });
    } catch {
      alert('Failed to extract text from PDF. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Paperclip className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Add Context
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drop PDF file here or click to upload
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose PDF File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              title="Upload PDF File"
              aria-label="Upload PDF File"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Context Textarea */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-sm font-medium mb-2">
              Context (will be sent with each message)
            </label>
            <textarea
              value={localContext}
              onChange={(e) => setLocalContext(e.target.value)}
              placeholder="Paste your context here or upload a PDF file..."
              className={`flex-1 min-h-[200px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary ${
                isOverLimit ? 'border-red-500' : 'border-border'
              }`}
            />
            
            {/* Word Counter */}
            <WordCounter 
              text={localContext}
              maxWords={MAX_WORDS}
              onClear={() => setLocalContext('')}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isOverLimit}
            >
              Save Context
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
