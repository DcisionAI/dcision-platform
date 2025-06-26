import React from 'react';
import KnowledgeBase from '@/components/KnowledgeBase';
import HeroSection from "@/components/HeroSection";

const KnowledgeBasePage: React.FC = () => {
  return (
    <div className="p-4 md:p-8">
      <HeroSection 
        title="Knowledge Base" 
        tagline="Manage and query your enterprise knowledge base for intelligent decision support" 
      />
      <div className="mt-8">
        <KnowledgeBase />
      </div>
    </div>
  );
};

export default KnowledgeBasePage; 