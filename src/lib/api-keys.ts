// API Keys utility functions - SECURE VERSION
// Note: API keys should NEVER be stored in localStorage or client-side code
// They should only be stored in environment variables on the server

export const API_KEYS = {
  GEMINI: process.env.GEMINI_API_KEY || '',
  OPENAI: process.env.OPENAI_API_KEY || '',
} as const;

// Check if API keys are configured
export const areApiKeysConfigured = (): boolean => {
  return !!(API_KEYS.GEMINI && API_KEYS.OPENAI);
};

// Get API key (server-side only)
export const getApiKey = (key: keyof typeof API_KEYS): string => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return API_KEYS[key];
};
