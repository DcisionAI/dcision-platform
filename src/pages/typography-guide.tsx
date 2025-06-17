import React from 'react';

const TypographyGuide: React.FC = () => (
  <div className="max-w-2xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-bold font-sans text-docs-text mb-6">Typography Style Guide</h1>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-sans text-docs-text mb-2">Headings</h2>
        <h1 className="text-4xl font-bold font-sans text-docs-text">Heading 1 (text-4xl font-bold text-docs-text)</h1>
        <h2 className="text-2xl font-bold font-sans text-docs-text">Heading 2 (text-2xl font-bold text-docs-text)</h2>
        <h3 className="text-xl font-semibold font-sans text-docs-text">Heading 3 (text-xl font-semibold text-docs-text)</h3>
        <h4 className="text-lg font-semibold font-sans text-docs-text">Heading 4 (text-lg font-semibold text-docs-text)</h4>
      </div>
      <div>
        <h2 className="text-2xl font-bold font-sans text-docs-text mb-2">Body Text</h2>
        <p className="text-base font-normal font-sans text-docs-text">Body text (text-base font-normal text-docs-text)</p>
        <p className="text-lg font-normal font-sans text-docs-text">Large body text (text-lg font-normal text-docs-text)</p>
        <p className="text-base font-medium font-sans text-docs-muted">Muted body text (text-base font-medium text-docs-muted)</p>
      </div>
      <div>
        <h2 className="text-2xl font-bold font-sans text-docs-text mb-2">Labels & Captions</h2>
        <p className="text-sm font-medium font-sans text-docs-muted uppercase tracking-wide">Label (text-sm font-medium uppercase tracking-wide text-docs-muted)</p>
        <p className="text-xs font-medium font-sans text-docs-muted">Caption (text-xs font-medium text-docs-muted)</p>
      </div>
      <div className="bg-docs-dark-bg rounded-lg p-6 mt-8">
        <h2 className="text-2xl font-bold font-sans text-docs-dark-text mb-2">Dark Mode Example</h2>
        <h1 className="text-4xl font-bold font-sans text-docs-dark-text">Heading 1 (Dark)</h1>
        <p className="text-base font-normal font-sans text-docs-dark-text">Body text (Dark)</p>
        <p className="text-sm font-medium font-sans text-docs-dark-muted uppercase tracking-wide">Label (Dark)</p>
        <p className="text-xs font-medium font-sans text-docs-dark-muted">Caption (Dark)</p>
      </div>
    </div>
  </div>
);

export default TypographyGuide; 