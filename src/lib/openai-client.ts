import OpenAI from 'openai';

// Multiple API keys for load balancing
const API_KEYS = [
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_API_KEY_2,
  process.env.OPENAI_API_KEY_3,
  process.env.OPENAI_API_KEY_4,
].filter(Boolean) as string[];

if (API_KEYS.length === 0) {
  throw new Error('No OpenAI API keys configured');
}

// Rate limit tracking per key
const keyUsage = new Map<string, {
  requests: number;
  tokens: number;
  lastReset: number;
  isRateLimited: boolean;
  rateLimitUntil?: number;
}>();

// Initialize usage tracking
API_KEYS.forEach(key => {
  keyUsage.set(key, {
    requests: 0,
    tokens: 0,
    lastReset: Date.now(),
    isRateLimited: false
  });
});

// Get the best available key
function getBestKey(): string {
  const now = Date.now();
  const availableKeys = API_KEYS.filter(key => {
    const usage = keyUsage.get(key)!;
    
    // Reset counters every minute
    if (now - usage.lastReset > 60000) {
      usage.requests = 0;
      usage.tokens = 0;
      usage.lastReset = now;
    }
    
    // Check if key is rate limited
    if (usage.isRateLimited && usage.rateLimitUntil && now < usage.rateLimitUntil) {
      return false;
    }
    
    // Reset rate limit flag if time has passed
    if (usage.isRateLimited && usage.rateLimitUntil && now >= usage.rateLimitUntil) {
      usage.isRateLimited = false;
      delete usage.rateLimitUntil;
    }
    
    return true;
  });
  
  if (availableKeys.length === 0) {
    throw new Error('All API keys are rate limited');
  }
  
  // Return the key with least usage
  return availableKeys.reduce((best, current) => {
    const bestUsage = keyUsage.get(best)!;
    const currentUsage = keyUsage.get(current)!;
    return currentUsage.requests < bestUsage.requests ? current : best;
  });
}

// Create OpenAI client with key rotation
function createOpenAIClient(key: string): OpenAI {
  return new OpenAI({ apiKey: key });
}

// Enhanced OpenAI client with load balancing
export class LoadBalancedOpenAI {
  async chat(completions: OpenAI.Chat.CompletionCreateParams): Promise<OpenAI.Chat.ChatCompletion> {
    let lastError: any;
    
    // Try each available key
    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      const key = getBestKey();
      const client = createOpenAIClient(key);
      const usage = keyUsage.get(key)!;
      
      try {
        const result = await client.chat.completions.create(completions);
        
        // Update usage tracking (only for non-streaming responses)
        if ('usage' in result && result.usage) {
          usage.requests++;
          usage.tokens += result.usage.total_tokens || 0;
        }
        
        return result as OpenAI.Chat.ChatCompletion;
      } catch (error: any) {
        lastError = error;
        
        if (error?.status === 429) {
          // Mark key as rate limited
          const retryAfter = parseInt(error.headers?.['retry-after-ms'] || error.headers?.['retry-after']) || 60000;
          usage.isRateLimited = true;
          usage.rateLimitUntil = Date.now() + retryAfter;
          
          console.warn(`Key rate limited, switching to next key. Retry after: ${retryAfter}ms`);
          continue;
        }
        
        // For other errors, try next key
        console.warn(`API error with key, trying next: ${error.message}`);
        continue;
      }
    }
    
    throw lastError || new Error('All API keys failed');
  }
  
  // Get usage statistics
  getUsageStats() {
    return Array.from(keyUsage.entries()).map(([key, usage]) => ({
      key: key.substring(0, 8) + '...',
      requests: usage.requests,
      tokens: usage.tokens,
      isRateLimited: usage.isRateLimited,
      rateLimitUntil: usage.rateLimitUntil
    }));
  }
  
  // Get available keys count
  getAvailableKeysCount(): number {
    const now = Date.now();
    return API_KEYS.filter(key => {
      const usage = keyUsage.get(key)!;
      return !usage.isRateLimited || (usage.rateLimitUntil && now >= usage.rateLimitUntil);
    }).length;
  }
}

// Export singleton instance
export const openai = new LoadBalancedOpenAI(); 