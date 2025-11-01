"use server";
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/chat - Handle chat messages with secure API key access
export async function POST(request: NextRequest) {
  try {
    const { message, context, apiKey, selectedProvider } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not provided. Please add it using the settings dialog' },
        { status: 400 }
      );
    }

    // Use the selected provider
    try {
      if (selectedProvider === 'gemini') {
        // Use Google Generative AI for Gemini with streaming
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        });
        
        // Combine context and message
        const fullMessage = context 
          ? `Context: ${context}\n\nUser Message: ${message}`
          : message;
        
        // Generate content without streaming
        const result = await model.generateContent(fullMessage);
        const response_text = result.response.text();
        
        return NextResponse.json({
          message: response_text,
          timestamp: new Date().toISOString(),
          provider: 'gemini-2.5-flash',
          model: 'gemini-2.5-flash'
        });
      } else {
        // OpenAI implementation would go here
        return NextResponse.json({
          message: 'OpenAI integration not implemented yet. Please select Gemini.',
          timestamp: new Date().toISOString(),
          provider: 'openai',
          model: 'gpt-3.5-turbo'
        });
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: `Failed to get response from ${selectedProvider}. Please check your API key and try again.`,
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
