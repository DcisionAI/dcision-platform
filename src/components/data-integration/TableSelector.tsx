import { useEffect, useState } from 'react';
import Modal from './Modal';

interface TableSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (tables: string[]) => void;
  initialSelection?: string[];
}

export default function TableSelector({
  open,
  onClose,
  onSelect,
  initialSelection = []
}: TableSelectorProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch('/api/data/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTables(data);
        } else if (Array.isArray(data.tables)) {
          setTables(data.tables);
        } else {
          setError('Unexpected response format');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tables:', err);
        setError('Failed to load tables');
        setLoading(false);
      });
  }, [open]);

  const toggle = (table: string) => {
    setSelected(prev =>
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
  };

  const handleNext = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Tables to Scan" widthClass="max-w-xl">
      {loading && <div className="text-center py-4">Loading tables...</div>}
      {error && <div className="text-center text-red-600 py-4">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {tables.map(table => (
            <label key={table} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
              <input
                type="checkbox"
                checked={selected.includes(table)}
                onChange={() => toggle(table)}
              />
              <span className="text-docs-text">{table}</span>
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end space-x-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-docs-accent text-white rounded"
          disabled={selected.length === 0}
        >
          Next
        </button>
      </div>
    </Modal>
  );
}