import React from 'react';

export interface Step4PreviewMCPProps {
  config: any;
}

const Step4PreviewMCP: React.FC<Step4PreviewMCPProps> = ({ config }) => {
  const jsonText = JSON.stringify(config, null, 2);
  const handleCopy = () => navigator.clipboard.writeText(jsonText);
  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 4: Preview MCP</h2>
      <div className="flex space-x-4 mb-2">
        <button onClick={handleCopy} className="px-4 py-2 bg-blue-600 text-white rounded">
          Copy JSON
        </button>
        <button onClick={handleDownload} className="px-4 py-2 bg-green-600 text-white rounded">
          Download MCP
        </button>
      </div>
      <pre
        className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words overflow-auto"
        style={{ maxHeight: '400px' }}
      >
        {jsonText}
      </pre>
    </div>
  );
};

export default Step4PreviewMCP;