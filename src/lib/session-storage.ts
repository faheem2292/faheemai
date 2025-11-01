// Shared session storage for API keys
export const sessionKeys = new Map<string, { geminiKey: string; openaiKey: string }>();

export const getSessionKeys = (sessionId: string) => {
  return sessionKeys.get(sessionId);
};

export const setSessionKeys = (sessionId: string, keys: { geminiKey: string; openaiKey: string }) => {
  sessionKeys.set(sessionId, keys);
};

export const updateSessionKey = (sessionId: string, keyType: 'geminiKey' | 'openaiKey', value: string) => {
  const existing = sessionKeys.get(sessionId) || { geminiKey: '', openaiKey: '' };
  sessionKeys.set(sessionId, {
    ...existing,
    [keyType]: value
  });
};
