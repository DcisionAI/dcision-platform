import React from 'react';

const steps = [
  {
    number: 1,
    title: 'Input Analysis',
    description: 'AI analyzes your natural language query to understand intent and context.',
  },
  {
    number: 2,
    title: 'Intent Classification',
    description: "Determines if it's a knowledge query, optimization problem, or hybrid analysis.",
  },
  {
    number: 3,
    title: 'Path Selection',
    description: 'Routes to appropriate solution: RAG, Optimization, or Hybrid approach.',
  },
  {
    number: 4,
    title: 'Solution Delivery',
    description: 'Provides comprehensive response with confidence metrics and analysis.',
  },
];

const HowIntentAnalysisWorks = () => {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How DcisionAI Works
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 -translate-y-1/2" aria-hidden="true"></div>
          <div className="relative grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-bold mx-auto">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-800">{step.title}</h3>
                <p className="mt-2 text-base text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowIntentAnalysisWorks; 