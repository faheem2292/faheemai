import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSessionKeys } from '@/lib/session-storage';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const sessionKeysData = getSessionKeys(sessionId);
    
    if (!sessionKeysData?.geminiKey) {
      return NextResponse.json({
        error: 'No Gemini API key found in session',
        sessionId,
        hasSessionData: !!sessionKeysData
      });
    }

    const apiKey = sessionKeysData.geminiKey;
    
    // Test the API key format
    const keyInfo = {
      length: apiKey.length,
      startsWith: apiKey.substring(0, 10),
      endsWith: apiKey.substring(apiKey.length - 10),
      hasSpaces: apiKey.includes(' '),
      hasNewlines: apiKey.includes('\n'),
      hasCarriageReturns: apiKey.includes('\r')
    };

    // Try to create a Google AI instance and test with a simple request
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Test with a simple generateContent call
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      return NextResponse.json({
        success: true,
        message: 'API key is valid',
        keyInfo,
        testResponse: response.text().substring(0, 100)
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'API key validation failed',
        keyInfo,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
