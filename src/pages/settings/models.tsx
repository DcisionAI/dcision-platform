import Layout from '@/components/Layout';
import React, { useRef, useState } from 'react';

export default function ModelUploadSettings() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadResult(null);
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    try {
      const res = await fetch('/api/models/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadResult(`Uploaded ${data.count} file(s) successfully!`);
      } else {
        setUploadResult('Upload failed.');
      }
    } catch (err) {
      setUploadResult('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Model Upload</h1>
        <section className="mb-10 p-6 bg-white rounded shadow border">
          <h2 className="text-lg font-semibold mb-2">Upload Optimization Model Files</h2>
          <p className="mb-4 text-gray-600">
            Upload your own optimization models (Python, Jupyter, JSON, Markdown, or text). These will be indexed for RAG and available for model building.
          </p>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".py,.ipynb,.json,.md,.txt"
              className="border p-2 rounded"
              disabled={uploading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {uploadResult && <div className="text-green-600 font-medium">{uploadResult}</div>}
          </form>
        </section>
      </div>
    </Layout>
  );
} 