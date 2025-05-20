import React from 'react';
import classNames from 'classnames';

export interface Tab {
  label: string;
  value: string;
}

export interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, value, onChange, className }) => (
  <nav className={classNames('flex border-b border-gray-200', className)}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={classNames(
          'px-4 py-2 -mb-px text-sm font-medium transition-colors',
          value === tab.value
            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
            : 'border-b-2 border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-200',
          'focus:outline-none'
        )}
        type="button"
      >
        {tab.label}
      </button>
    ))}
  </nav>
);

export default Tabs; 