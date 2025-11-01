import { NextRequest, NextResponse } from 'next/server';
import { API_KEYS } from '@/lib/api-keys';
import { getSessionKeys, updateSessionKey } from '@/lib/session-storage';

// GET /api/keys - Check if API keys are configured
export async function GET(request: NextRequest) {
  try {
    // Check for session-based keys first
    const sessionId = request.headers.get('x-session-id') || 'default';
    const sessionKeysData = getSessionKeys(sessionId);
    
    // Check environment variables as fallback
    const hasEnvKeys = !!(API_KEYS.GEMINI && API_KEYS.OPENAI);
    const hasSessionKeys = !!(sessionKeysData?.geminiKey && sessionKeysData?.openaiKey);
    
    return NextResponse.json({
      configured: hasEnvKeys || hasSessionKeys,
      source: hasEnvKeys ? 'environment' : hasSessionKeys ? 'session' : 'none',
      message: hasEnvKeys || hasSessionKeys 
        ? 'API keys are configured' 
        : 'API keys not found. Please add them using the settings dialog',
      keys: {
        gemini: hasEnvKeys ? !!API_KEYS.GEMINI : !!sessionKeysData?.geminiKey,
        openai: hasEnvKeys ? !!API_KEYS.OPENAI : !!sessionKeysData?.openaiKey
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check API keys' },
      { status: 500 }
    );
  }
}

// POST /api/keys - Save API keys to session (individual or both)
export async function POST(request: NextRequest) {
  try {
    const { geminiKey, openaiKey } = await request.json();
    
    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        { error: 'At least one API key is required' },
        { status: 400 }
      );
    }

    // Generate a simple session ID (in production, use proper session management)
    const sessionId = request.headers.get('x-session-id') || 
                     Math.random().toString(36).substring(2, 15);
    
    // Update keys individually
    if (geminiKey) {
      updateSessionKey(sessionId, 'geminiKey', geminiKey.trim());
    }
    if (openaiKey) {
      updateSessionKey(sessionId, 'openaiKey', openaiKey.trim());
    }

    // Set session ID in response headers
    const response = NextResponse.json({
      success: true,
      message: 'API key(s) saved successfully',
      sessionId,
      savedKeys: {
        gemini: !!geminiKey,
        openai: !!openaiKey
      }
    });
    
    response.headers.set('x-session-id', sessionId);
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Failed to save API keys' },
      { status: 500 }
    );
  }
}
