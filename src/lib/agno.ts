import { apiFetch } from '@/utils/apiFetch';

export interface AgnoResponse {
  message: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

export class AgnoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgnoError';
  }
}

export async function sendMessageToAgno(message: string): Promise<AgnoResponse> {
  try {
    const response = await apiFetch('/api/agno/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new AgnoError(`Agno API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof AgnoError) {
      throw error;
    }
    throw new AgnoError('Failed to communicate with Agno API');
  }
} 