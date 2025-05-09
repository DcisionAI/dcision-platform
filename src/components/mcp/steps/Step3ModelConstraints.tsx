import React from 'react';

const Step3ModelConstraints: React.FC = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Step 3: Model & Constraints</h2>
    <div className="space-y-4">
      <details className="border rounded p-4">
        <summary className="font-medium">Variables</summary>
        <div className="mt-2 text-gray-600">{/* TODO: List variables table */}</div>
      </details>
      <details className="border rounded p-4">
        <summary className="font-medium">Constraints</summary>
        <div className="mt-2 text-gray-600">{/* TODO: List constraints table */}</div>
      </details>
      <details className="border rounded p-4">
        <summary className="font-medium">Objective</summary>
        <div className="mt-2 text-gray-600">{/* TODO: Objective form */}</div>
      </details>
    </div>
  </div>
);

export default Step3ModelConstraints;