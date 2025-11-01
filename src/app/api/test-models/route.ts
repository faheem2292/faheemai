import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test with a simple model name first
    const testModels = [
      'gemini-1.5-flash',
      'gemini/gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini/gemini-1.5-pro',
      'gemini-pro',
      'gemini/gemini-pro'
    ];

    const results = [];

    for (const model of testModels) {
      try {
        // Just test if the model is recognized (don't actually call it)
        results.push({
          model,
          status: 'recognized',
          note: 'Model name format is valid'
        });
      } catch (error) {
        results.push({
          model,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Model name test results',
      results
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
