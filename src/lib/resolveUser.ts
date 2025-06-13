import { NextApiRequest } from 'next';

export type AuthMethod = 'api_key';

export interface ResolvedUser {
  id: string;
  method: AuthMethod;
}

export async function resolveUser(req: NextApiRequest): Promise<ResolvedUser> {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new Error('No API key provided');
  }

  // TODO: Add proper API key validation and user resolution logic
  // For now, we'll just use the API key as the user ID
  return {
    id: apiKey,
    method: 'api_key'
  };
} 