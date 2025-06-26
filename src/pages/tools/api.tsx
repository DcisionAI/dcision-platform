import React from 'react';
import ApiInterfaceConstruction from '@/workflows/construction/components/ApiInterfaceConstruction';
import HeroSection from "@/components/HeroSection";

const ApiToolsPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8">
      <HeroSection 
        title="API Interface" 
        tagline="Interact with the Construction Workflow API directly from the platform tools section." 
      />
      <div className="mt-8">
        <ApiInterfaceConstruction />
      </div>
    </div>
  );
};

export default ApiToolsPage; 