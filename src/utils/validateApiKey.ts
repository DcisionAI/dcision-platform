// In-memory API key validation for demo purposes

declare global {
  // eslint-disable-next-line no-var
  var apiKeysStore: { [userId: string]: { id: string; created_at: string }[] } | undefined;
}

const apiKeysStore: { [userId: string]: { id: string; created_at: string }[] } = global.apiKeysStore || (global.apiKeysStore = {});

export async function validateApiKey(apiKey: string): Promise<boolean> {
  // Check if the API key exists for any user
  for (const userId in apiKeysStore) {
    if (apiKeysStore[userId].some((k) => k.id === apiKey)) {
      return true;
    }
  }
  return false;
} 