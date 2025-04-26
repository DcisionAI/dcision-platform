import React from 'react';
import MonacoEditor from '@monaco-editor/react';

interface PlaygroundEditorProps {
  config: any;
  onConfigChange: (config: any) => void;
}

export default function PlaygroundEditor({ config, onConfigChange }: PlaygroundEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    try {
      if (value) {
        const parsedConfig = JSON.parse(value);
        onConfigChange(parsedConfig);
      }
    } catch (error) {
      // Invalid JSON - don't update the config
      console.error('Invalid JSON:', error);
    }
  };

  return (
    <div className="playground-editor flex-1 min-h-0 flex flex-col">
      <h2 className="playground-section-title">Configuration</h2>
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={JSON.stringify(config, null, 2)}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  );
} 