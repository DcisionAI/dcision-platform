import React from 'react';

const Step3ModelConstraints: React.FC = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Step 3: Model & Constraints</h2>
    <div className="space-y-4">
      <details className="bg-docs-section border border-docs-section-border rounded-lg p-4">
        <summary className="font-medium text-docs-text">Variables</summary>
        <div className="mt-2 text-docs-muted text-sm">{/* TODO: List variables table */}</div>
      </details>
      <details className="bg-docs-section border border-docs-section-border rounded-lg p-4">
        <summary className="font-medium text-docs-text">Constraints</summary>
        <div className="mt-2 text-docs-muted text-sm">{/* TODO: List constraints table */}</div>
      </details>
      <details className="bg-docs-section border border-docs-section-border rounded-lg p-4">
        <summary className="font-medium text-docs-text">Objective</summary>
        <div className="mt-2 text-docs-muted text-sm">{/* TODO: Objective form */}</div>
      </details>
    </div>
  </div>
);

export default Step3ModelConstraints;