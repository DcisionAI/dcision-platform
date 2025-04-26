import React, { useState } from 'react';
import PlaygroundSidebar from './PlaygroundSidebar';
import PlaygroundEditor from './PlaygroundEditor';
import PlaygroundSettings from './PlaygroundSettings';

export default function Playground() {
  const [selectedTemplate, setSelectedTemplate] = useState('fleet_scheduling');
  const [mcpConfig, setMcpConfig] = useState({});
  const [response, setResponse] = useState(null);

  const handleSubmit = async () => {
    try {
      const result = await fetch('/api/mcp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          config: mcpConfig,
        }),
      });
      const data = await result.json();
      setResponse(data);
    } catch (error) {
      console.error('Error submitting MCP:', error);
    }
  };

  return (
    <div className="playground-container">
      <PlaygroundSidebar 
        selectedTemplate={selectedTemplate}
        onTemplateChange={setSelectedTemplate}
      />
      <div className="playground-main">
        <PlaygroundEditor
          config={mcpConfig}
          onConfigChange={setMcpConfig}
        />
        <div className="playground-controls">
          <button 
            className="playground-button"
            onClick={handleSubmit}
          >
            Submit MCP
          </button>
        </div>
        {response && (
          <div className="playground-response">
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>
      <PlaygroundSettings />
    </div>
  );
} 