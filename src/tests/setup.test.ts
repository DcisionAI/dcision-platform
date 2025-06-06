import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/encryption';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token'
          }
        },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id'
          }
        },
        error: null
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      delete: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    }))
  }))
}));

describe('Setup Flow', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    // Create a test user
    const email = `test-${Date.now()}@example.com`;
    const password = 'test-password-123';
    
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!user) throw new Error('Failed to create test user');

    testUser = {
      id: user.id,
      email,
      password,
    };
  });

  afterAll(async () => {
    // Clean up test user and their data
    await supabase.from('user_settings').delete().eq('user_id', testUser.id);
    await supabase.from('database_config').delete().eq('user_id', testUser.id);
  });

  it('should configure database connection', async () => {
    const dbConfig = {
      host: 'localhost',
      port: '5432',
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    };

    // Mock successful database configuration
    (supabase.from as jest.Mock).mockImplementation(() => ({
      upsert: jest.fn().mockResolvedValue({
        data: { id: 'test-db-config-id' },
        error: null
      })
    }));

    const response = await fetch('http://localhost:3000/api/setup/database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify(dbConfig)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should configure LLM settings', async () => {
    const llmConfig = {
      provider: 'openai',
      apiKey: 'test-api-key'
    };

    // Mock successful LLM configuration
    (supabase.from as jest.Mock).mockImplementation(() => ({
      upsert: jest.fn().mockResolvedValue({
        data: { id: 'test-llm-config-id' },
        error: null
      })
    }));

    const response = await fetch('http://localhost:3000/api/setup/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify(llmConfig)
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  async function getAuthToken(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (error) throw error;
    if (!session?.access_token) throw new Error('No access token');

    return session.access_token;
  }
}); 