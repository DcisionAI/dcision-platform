export const DEMO_CREDENTIALS = {
  email: 'demo@dcisionai.com',
  password: 'demo123!@#Demo'
} as const;

export const isDemoUser = (email: string) => email === DEMO_CREDENTIALS.email; 