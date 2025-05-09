import React from 'react';

export interface StepperProps {
  steps: string[];
  currentStep: number; // zero-based index
  onStepClick?: (step: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full flex items-center flex-nowrap mb-6 overflow-x-auto">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <React.Fragment key={idx}>
            <div className="flex items-center">
            <button
              type="button"
              onClick={() => onStepClick && idx < currentStep && onStepClick(idx)}
              disabled={!onStepClick || idx >= currentStep}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted
                  ? 'bg-blue-600 text-white'
                  : isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              } ${
                onStepClick && idx < currentStep
                  ? 'cursor-pointer hover:bg-blue-100'
                  : 'cursor-default'
              } disabled:opacity-100`}
            >
              {idx + 1}
            </button>
              <div className="ml-2 text-sm font-medium text-gray-700">{label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-auto border-t-2 mx-2" 
                   style={{ borderColor: idx < currentStep ? '#2563EB' : '#D1D5DB' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;