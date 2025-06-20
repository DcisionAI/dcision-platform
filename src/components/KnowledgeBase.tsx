import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { FileUploader } from 'react-drag-drop-files';

const fileTypes = ["PDF", "DOCX", "TXT", "JSON", "CSV"];

interface Vector {
  id: string;
  source: string;
  sourceType: string;
  chunk: string;
}

interface KnowledgeBaseProps {
  domain?: string;
}

export default function KnowledgeBase({ domain = 'construction' }: KnowledgeBaseProps) {
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<Vector[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchKnowledgeBaseFiles = useCallback(async () => {
    try {
      const response = await apiFetch('/api/rag/list');
      if (response.ok) {
        const data = await response.json();
        const uniqueFiles = data.vectors.reduce((acc: Vector[], current: Vector) => {
            if (!acc.find((item) => item.source === current.source)) {
                acc.push(current);
            }
            return acc;
        }, []);
        setKnowledgeBaseFiles(uniqueFiles);
      } else {
        console.error('Failed to fetch knowledge base files');
      }
    } catch (error) {
      console.error('Error fetching knowledge base files:', error);
    }
  }, []);

  useEffect(() => {
    fetchKnowledgeBaseFiles();
  }, [fetchKnowledgeBaseFiles]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiFetch('/api/rag/ingest', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('File uploaded and ingested successfully!');
        fetchKnowledgeBaseFiles();
      } else {
        const errorData = await response.json();
        alert(`Failed to ingest file: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-6 bg-docs-section dark:bg-gray-800/50 border rounded-lg border-docs-section-border dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-docs-text dark:text-docs-dark-text">Upload Documents</h3>
          <p className="text-docs-muted text-sm mb-4">
            Upload documents to the {domain} knowledge base for Retrieval-Augmented Generation (RAG).
          </p>
        </div>
        
        <div className="w-full">
          <FileUploader
            handleChange={handleFileUpload}
            name="file"
            types={fileTypes}
            label="Drag & drop a file here or click to select"
            disabled={uploading}
          />
          {uploading && <p className="text-blue-500 mt-2">Uploading and processing...</p>}
        </div>
      </div>

      <div className="space-y-4 p-6 bg-docs-section dark:bg-gray-800/50 border rounded-lg border-docs-section-border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-docs-text dark:text-docs-dark-text">Ingested Files</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-docs-section-border dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-docs-section text-docs-text dark:bg-docs-dark-bg dark:text-docs-dark-text">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-docs-section text-docs-text dark:bg-docs-dark-bg dark:text-docs-dark-text">
                  Source Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-docs-section text-docs-text dark:bg-docs-dark-bg dark:text-docs-dark-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-docs-section dark:bg-gray-800/50 divide-y divide-docs-section-border dark:divide-gray-700">
              {knowledgeBaseFiles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-docs-muted">
                    No files uploaded yet. Upload your first document to get started.
                  </td>
                </tr>
              ) : (
                knowledgeBaseFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-docs-text dark:text-docs-dark-text">
                      {file.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-docs-muted dark:text-docs-dark-muted">
                      {file.sourceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-docs-muted dark:text-docs-dark-muted">
                      <button 
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        onClick={() => {
                          // TODO: Implement delete functionality
                          alert('Delete functionality coming soon');
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 