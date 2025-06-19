import React from 'react';
import AgentChat from '../components/AgentChat';
import HeroSection from '../components/HeroSection';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 py-8">
        <HeroSection />
        <AgentChat placeholder="Ask about construction workflows, project phases, or resource allocation..." />
      </div>
    </div>
  );
};

export default Home; 