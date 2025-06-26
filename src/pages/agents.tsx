import React from 'react';
import Layout from '../components/Layout';
import AgentChat from '../components/AgentChat';

const AgentsPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🤖 Agentic Decision Flow
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Experience the power of multi-agent collaboration with real-time D3 visualization of agent interactions and message flow.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <AgentChat 
              apiEndpoint="/api/dcisionai/agentic/chat"
              placeholder="Ask me anything about construction optimization, knowledge retrieval, or hybrid analysis..."
              showSmartPrompts={true}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AgentsPage; 