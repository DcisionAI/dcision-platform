import { handleAuth } from '@supabase/auth-helpers-nextjs';

// Supabase Auth Helpers Next.js catch-all route
// This will handle /api/auth/* endpoints for sign in, sign up, callback, etc.
export default handleAuth();