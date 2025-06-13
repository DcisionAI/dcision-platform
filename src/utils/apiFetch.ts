const API_KEY_STORAGE_KEY = 'dcisionai_api_key';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE_KEY) : null;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: apiKey ? `Bearer ${apiKey}` : '',
    },
  });
} 