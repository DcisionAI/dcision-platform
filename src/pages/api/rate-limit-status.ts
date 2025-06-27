import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openai-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get usage statistics from load-balanced client
    const usageStats = openai.getUsageStats();
    const availableKeys = openai.getAvailableKeysCount();
    const totalKeys = usageStats.length;

    // Make a minimal API call to test connectivity
    const result = await openai.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });

    res.status(200).json({
      message: 'Rate limit status retrieved successfully',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      usage: {
        totalKeys,
        availableKeys,
        keyStats: usageStats
      },
      connectivity: 'OK'
    });

  } catch (error: any) {
    // If we get a rate limit error, extract the information
    if (error?.status === 429) {
      const headers = error.headers || {};
      const rateLimitInfo = {
        requests: {
          limit: headers['x-ratelimit-limit-requests'],
          remaining: headers['x-ratelimit-remaining-requests'],
          reset: headers['x-ratelimit-reset-requests'],
        },
        tokens: {
          limit: headers['x-ratelimit-limit-tokens'],
          remaining: headers['x-ratelimit-remaining-tokens'],
          reset: headers['x-ratelimit-reset-tokens'],
        },
        retryAfter: headers['retry-after-ms'] || headers['retry-after'],
        organization: headers['openai-organization'],
      };

      const usageStats = openai.getUsageStats();
      const availableKeys = openai.getAvailableKeysCount();

      res.status(429).json({
        message: 'Rate limit exceeded',
        rateLimits: rateLimitInfo,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'rate_limited',
        usage: {
          totalKeys: usageStats.length,
          availableKeys,
          keyStats: usageStats
        }
      });
    } else {
      console.error('Rate limit status check failed:', error);
      const usageStats = openai.getUsageStats();
      const availableKeys = openai.getAvailableKeysCount();

      res.status(500).json({
        error: 'Failed to check rate limit status',
        message: error.message,
        timestamp: new Date().toISOString(),
        status: 'error',
        usage: {
          totalKeys: usageStats.length,
          availableKeys,
          keyStats: usageStats
        }
      });
    }
  }
} 