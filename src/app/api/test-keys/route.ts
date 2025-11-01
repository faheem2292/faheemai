import { NextRequest, NextResponse } from 'next/server';
import { getSessionKeys } from '@/lib/session-storage';

// Simple test endpoint to check if keys are being saved
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const sessionKeysData = getSessionKeys(sessionId);
    
    return NextResponse.json({
      sessionId,
      hasSessionId: !!request.headers.get('x-session-id'),
      hasSessionData: !!sessionKeysData,
      hasGeminiKey: !!sessionKeysData?.geminiKey,
      hasOpenAIKey: !!sessionKeysData?.openaiKey,
      message: 'Test endpoint working'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
