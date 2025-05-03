import Layout from '@/components/Layout';
import { useState } from 'react';
import ConnectorCatalog from '@/components/data-integration/ConnectorCatalog';
import ConnectorSetupWizard from '@/components/data-integration/ConnectorSetupWizard';
import ConnectionList from '@/components/data-integration/ConnectionList';

export default function DataIntegrationPage() {
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleConnectorSelect = (connector: any) => {
    setSelectedConnector(connector);
    setWizardOpen(true);
  };

  const handleWizardComplete = (config: Record<string, string | number>) => {
    // TODO: Save connection, trigger Airbyte API, etc.
    alert(`Connector configured!\n${JSON.stringify(config, null, 2)}`);
    setSelectedConnector(null);
    setWizardOpen(false);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-docs-body overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-docs-heading mb-8">
                Data Integration
              </h1>
              {/* Connector Catalog will go here */}
              <div className="my-8">
                <ConnectorCatalog onSelect={handleConnectorSelect} />
              </div>
              <ConnectorSetupWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                connector={selectedConnector}
                onComplete={handleWizardComplete}
              />
              <ConnectionList />
              {/* Future: Setup wizard, connection list, sync monitoring */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 