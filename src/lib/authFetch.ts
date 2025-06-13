export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const apiKey = localStorage.getItem('dcisionai_api_key');
  const headers = {
    ...(init.headers || {}),
    ...(apiKey ? { 'X-API-Key': apiKey } : {})
  };

  const response = await fetch(input, { ...init, headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`authFetch error: ${response.status} ${errorText}`);
  }

  return response;
} 