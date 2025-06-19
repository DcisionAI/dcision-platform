import { useTheme } from '@/components/layout/ThemeContext';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

export default function WorkflowDiagram() {
  const { theme } = useTheme();

  const PathCard = ({ title, description, examples, bgColor, borderColor, textColor }: {
    title: string;
    description: string;
    examples: string[];
    bgColor: string;
    borderColor: string;
    textColor: string;
  }) => (
    <div className={`${bgColor} ${borderColor} rounded-lg p-4 transition-colors duration-300`}>
      <h5 className={`font-semibold ${textColor} text-sm mb-2`}>
        {title}
      </h5>
      <p className={`text-xs ${textColor} mb-3 opacity-90`}>
        {description}
      </p>
      <ul className={`text-xs ${textColor} space-y-1 opacity-80`}>
        {examples.map((example, idx) => (
          <li key={idx}>• {example}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`bg-docs-section rounded-xl p-8 border border-docs-section-border transition-colors duration-300 ${theme === 'dark' ? 'bg-docs-section/30' : ''}`}>
      <h3 className={`text-xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
        How It Works
      </h3>
      
      <div className="max-w-4xl mx-auto">
        {/* Natural Language Query */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E07A4A]/10 text-[#E07A4A] rounded-full text-sm font-medium">
            <DocumentTextIcon className="w-4 h-4" />
            Natural Language Query
          </div>
        </div>

        {/* Intent Analysis & Smart Routing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className={`${theme === 'dark' ? 'bg-[#E07A4A]/5' : 'bg-[#E07A4A]/10'} rounded-lg p-4 mb-3 transition-colors duration-300`}>
              <MagnifyingGlassIcon className="w-8 h-8 text-[#E07A4A] mx-auto mb-2" />
              <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                Intent Analysis
              </h4>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-docs-muted'}`}>
              Determines execution path
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 text-[#E07A4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          
          <div className="text-center">
            <div className={`${theme === 'dark' ? 'bg-[#E07A4A]/5' : 'bg-[#E07A4A]/10'} rounded-lg p-4 mb-3 transition-colors duration-300`}>
              <CpuChipIcon className="w-8 h-8 text-[#E07A4A] mx-auto mb-2" />
              <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-docs-text'}`}>
                Smart Routing
              </h4>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-docs-muted'}`}>
              RAG, Optimization, or Hybrid
            </p>
          </div>
        </div>

        {/* Execution Paths */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PathCard
            title="RAG Path"
            description="Query knowledge base for instant answers"
            examples={[
              'Knowledge queries',
              'Best practices',
              'Regulatory compliance',
              'Historical data',
              'Industry standards'
            ]}
            bgColor={theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}
            borderColor={theme === 'dark' ? 'border border-blue-800' : 'border border-blue-200'}
            textColor={theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}
          />
          
          <PathCard
            title="Optimization Path"
            description="Build and solve mathematical models"
            examples={[
              'Resource allocation',
              'Project scheduling',
              'Cost optimization',
              'Risk management',
              'Supply chain',
              'Workforce planning'
            ]}
            bgColor={theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'}
            borderColor={theme === 'dark' ? 'border border-green-800' : 'border border-green-200'}
            textColor={theme === 'dark' ? 'text-green-300' : 'text-green-700'}
          />
          
          <PathCard
            title="Hybrid Path"
            description="Combine knowledge and optimization"
            examples={[
              'Combined knowledge + optimization',
              'Data-driven decisions',
              'Context-aware solutions',
              'Integrated workflows'
            ]}
            bgColor={theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'}
            borderColor={theme === 'dark' ? 'border border-purple-800' : 'border border-purple-200'}
            textColor={theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}
          />
        </div>
      </div>
    </div>
  );
} 