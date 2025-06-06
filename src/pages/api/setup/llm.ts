import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSupabase } from '@/lib/supabase';
import { encrypt } from '@/lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    // Validate the API key based on provider
    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Invalid OpenAI API key');
        }
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }]
          })
        });

        if (!response.ok) {
          throw new Error('Invalid Anthropic API key');
        }
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    // Encrypt and store the API key
    const encryptedKey = encrypt(apiKey);
    
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        llm_provider: provider,
        llm_api_key: encryptedKey,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in LLM setup:', error);
    return res.status(500).json({ error: 'Failed to configure LLM settings' });
  }
} 