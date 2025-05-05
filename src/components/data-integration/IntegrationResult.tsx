import { FC } from 'react';

interface IntegrationResultProps {
  result: any;
}

const IntegrationResult: FC<IntegrationResultProps> = ({ result }) => {
  const { output, thoughtProcess } = result;
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Data Integration Result</h3>
      <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 max-h-40 overflow-y-auto">
        <h4 className="font-medium">Thought Process:</h4>
        <pre className="text-xs whitespace-pre-wrap">{thoughtProcess}</pre>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4 overflow-auto max-h-60">
        <h4 className="font-medium mb-2">Output:</h4>
        <pre className="text-xs">{JSON.stringify(output, null, 2)}</pre>
      </div>
    </div>
  );
};

export default IntegrationResult;