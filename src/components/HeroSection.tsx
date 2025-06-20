import React from 'react';

interface HeroSectionProps {
  title?: string;
  tagline?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  title,
  tagline = "Optimizing workflows with intelligent decision-making" 
}) => {
  return (
    <div className="w-full mb-8 text-center">
      {title && (
        <h1 className="text-3xl font-bold text-gradient-brand">
          {title}
        </h1>
      )}
      <p className="mt-2 text-sm text-docs-muted dark:text-docs-dark-muted">
        {tagline}
      </p>
      <div className="mt-8 inline-flex gap-8 px-6 py-4 rounded-lg border border-docs-section-border dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-sm text-blue-600 dark:text-blue-400">1</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-docs-text dark:text-docs-dark-text">Input Analysis</p>
            <p className="text-xs text-docs-muted">AI analyzes query intent</p>
          </div>
          <span className="text-gray-300 dark:text-gray-600">→</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-sm text-green-600 dark:text-green-400">2</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-docs-text dark:text-docs-dark-text">Intent Classification</p>
            <p className="text-xs text-docs-muted">Determines query type</p>
          </div>
          <span className="text-gray-300 dark:text-gray-600">→</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-sm text-purple-600 dark:text-purple-400">3</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-docs-text dark:text-docs-dark-text">Path Selection</p>
            <p className="text-xs text-docs-muted">Routes to solution</p>
          </div>
          <span className="text-gray-300 dark:text-gray-600">→</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <span className="text-sm text-orange-600 dark:text-orange-400">4</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-docs-text dark:text-docs-dark-text">Solution Delivery</p>
            <p className="text-xs text-docs-muted">Delivers with metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 