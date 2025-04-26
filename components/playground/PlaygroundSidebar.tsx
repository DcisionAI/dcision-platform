import React from 'react';

interface PlaygroundSidebarProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
}

const templates = [
  {
    id: 'fleet_scheduling',
    name: 'Fleet Scheduling',
    description: 'Optimize vehicle fleet schedules and routes'
  },
  {
    id: 'pickup_delivery',
    name: 'Pickup & Delivery',
    description: 'Manage pickup and delivery operations'
  },
  {
    id: 'time_dependent_vrp',
    name: 'Time-Dependent VRP',
    description: 'Route optimization with time-dependent travel times'
  },
  {
    id: 'job_shop',
    name: 'Job Shop Scheduling',
    description: 'Optimize manufacturing operations'
  },
  {
    id: 'rcpsp',
    name: 'Project Scheduling',
    description: 'Resource-constrained project scheduling'
  }
];

export default function PlaygroundSidebar({ selectedTemplate, onTemplateChange }: PlaygroundSidebarProps) {
  return (
    <div className="playground-sidebar">
      <h2 className="playground-section-title">Templates</h2>
      <div className="flex flex-col gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            className={`playground-button ${
              selectedTemplate === template.id ? 'bg-opacity-80' : 'bg-opacity-0'
            }`}
            onClick={() => onTemplateChange(template.id)}
          >
            <div className="text-left">
              <div className="font-medium">{template.name}</div>
              <div className="text-sm text-gray-300">{template.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 