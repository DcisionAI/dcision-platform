import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface CustomerKey {
  id: number;
  customer_name: string;
  api_key: string;
  status: string;
  created_at: string;
  last_used_at: string | null;
}

export default function DcisionAIAdmin() {
  const [keys, setKeys] = useState<CustomerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ customer_name: '', api_key: '', status: 'active' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer API keys from Supabase
  async function fetchKeys() {
    setLoading(true);
    setError(null);
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('customer_api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setKeys([]);
    } else {
      setKeys((data ?? []) as unknown as CustomerKey[]);
    }
    setLoading(false);
  }
  
  useEffect(() => {
    fetchKeys();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Generate a random API key if not provided
    const api_key = form.api_key || cryptoRandomKey();
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('customer_api_keys').insert([
      { customer_name: form.customer_name, api_key, status: form.status },
    ]);
    if (error) setError(error.message);
    else {
      setForm({ customer_name: '', api_key: '', status: 'active' });
      await fetchKeys();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this API key?')) return;
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('customer_api_keys').delete().eq('id', id);
    if (error) setError(error.message);
    else await fetchKeys();
  }

  function startEdit(key: CustomerKey) {
    setEditingId(key.id);
    setForm({
      customer_name: key.customer_name,
      api_key: key.api_key,
      status: key.status,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('customer_api_keys')
      .update({
        customer_name: form.customer_name,
        api_key: form.api_key,
        status: form.status,
      })
      .eq('id', editingId);
    if (error) setError(error.message);
    else {
      setEditingId(null);
      setForm({ customer_name: '', api_key: '', status: 'active' });
      await fetchKeys();
    }
  }

  function cryptoRandomKey() {
    if (typeof window !== 'undefined' && window.crypto) {
      return Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // fallback (not cryptographically secure)
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 bg-docs-main-bg text-docs-text text-base">
          <h1 className="text-3xl font-bold mb-8">DcisionAI Admin: Customer API Keys</h1>
          {error && <div className="text-red-400 mb-4">{error}</div>}
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="flex flex-wrap items-center gap-2 mb-8">
            <input
              name="customer_name"
              placeholder="Customer Name"
              value={form.customer_name}
              onChange={handleChange}
              required
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
            />
            <input
              name="api_key"
              placeholder="API Key (leave blank to auto-generate)"
              value={form.api_key}
              onChange={handleChange}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
            >
              <option value="active">active</option>
              <option value="revoked">revoked</option>
            </select>
            <button type="submit" className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold">
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ customer_name: '', api_key: '', status: 'active' }); }}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold"
              >
                Cancel
              </button>
            )}
          </form>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-700 rounded-lg">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Customer Name</th>
                    <th className="px-3 py-2 text-left">API Key</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Last Used</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="border-t border-gray-700">
                      <td className="px-3 py-2">{key.id}</td>
                      <td className="px-3 py-2">{key.customer_name}</td>
                      <td className="px-3 py-2 font-mono text-xs break-all">{key.api_key}</td>
                      <td className="px-3 py-2">{key.status}</td>
                      <td className="px-3 py-2">{key.created_at ? new Date(key.created_at).toLocaleString() : ''}</td>
                      <td className="px-3 py-2">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : ''}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => startEdit(key)}
                          className="mr-2 px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 