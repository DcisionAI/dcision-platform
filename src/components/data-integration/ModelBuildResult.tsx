import { FC } from 'react';

export interface OrchestrationResult {
  step: { id: string; action: string; description?: string; required?: boolean };  
  agent?: string;
  result: any;
  thoughtProcess?: string;
  error?: string;
}

interface ModelBuildResultProps {
  results: OrchestrationResult[];
}

const ModelBuildResult: FC<ModelBuildResultProps> = ({ results }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Model Build Results</h3>
      {results.map((r, idx) => (
        <div key={idx} className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <p><strong>Step:</strong> {r.step.id} ({r.step.action})</p>
          <p><strong>Agent:</strong> {r.agent || 'None'}</p>
          {r.error ? (
            <p className="text-red-600"><strong>Error:</strong> {r.error}</p>
          ) : (
            <div>
              <p><strong>Output:</strong></p>
              <pre className="text-xs bg-white p-2 border border-gray-100 rounded overflow-auto max-h-48">{JSON.stringify(r.result, null, 2)}</pre>
            </div>
          )}
          {r.thoughtProcess && (
            <div className="mt-2">
              <p><strong>Thought Process:</strong></p>
              <pre className="text-xs bg-white p-2 border border-gray-100 rounded overflow-auto max-h-48 whitespace-pre-wrap">{r.thoughtProcess}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModelBuildResult;