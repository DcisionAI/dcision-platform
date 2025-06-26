import React from 'react';
import FlowBuilder from '@/components/FlowBuilder';
import HeroSection from "@/components/HeroSection";

const FlowBuilderPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8">
      <HeroSection 
        title="Flow Builder" 
        tagline="Build and manage intelligent workflows with visual drag-and-drop interface" 
      />
      <div className="mt-8">
        <FlowBuilder />
      </div>
    </div>
  );
};

export default FlowBuilderPage; 