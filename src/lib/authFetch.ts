import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function authFetch(input: RequestInfo, init: RequestInit = {}, retry = true) {
  // Always create a new client to get the latest session
  const supabase = createClientComponentClient();
  let { data: { session }, error } = await supabase.auth.getSession();

  // If no session, try to refresh
  if (!session && retry) {
    await supabase.auth.refreshSession();
    ({ data: { session }, error } = await supabase.auth.getSession());
  }

  const accessToken = session?.access_token;
  const headers = {
    ...(init.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
  console.log('authFetch: accessToken', accessToken);
  console.log('authFetch: headers', headers);

  const response = await fetch(input, { ...init, headers });

  // If unauthorized and we haven't retried yet, try refreshing session and retry
  if (response.status === 401 && retry) {
    await supabase.auth.refreshSession();
    return authFetch(input, init, false);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`authFetch error: ${response.status} ${errorText}`);
  }

  return response;
} 