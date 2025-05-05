import { FC } from 'react';

interface MappingResultProps {
  result: any;
}

const MappingResult: FC<MappingResultProps> = ({ result }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Field Mapping Result</h3>
      <div className="bg-gray-50 border border-gray-200 rounded p-4 overflow-auto max-h-80">
        <pre className="text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MappingResult;