import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-docs-text">DcisionAI</h1>
        <p className="text-lg mb-8 text-docs-muted">
          AgentAI Decision Workflows: Automate, optimize, and explain your most complex business decisions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section">
            <h2 className="text-xl font-semibold mb-2 text-docs-text">What is DcisionAI?</h2>
            <p className="text-docs-muted">
              DcisionAI helps you model, optimize, and automate complex business decisions using Agentic AI.
            </p>
          </div>
          <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section">
            <h2 className="text-xl font-semibold mb-2 text-docs-text">Key Features</h2>
            <ul className="list-disc ml-5 text-docs-muted">
              <li>Fleet & Workforce Optimization</li>
              <li>Project & Resource Scheduling</li>
              <li>Explainable AI Agents</li>
              <li>Interactive Playground</li>
            </ul>
          </div>
          <div className="border border-docs-section-border shadow-sm rounded-xl p-6 bg-docs-section md:col-span-2">
            <h2 className="text-xl font-semibold mb-2 text-docs-text">Quick Start</h2>
            <ol className="list-decimal ml-5 text-docs-muted">
              <li>Connect your data sources</li>
              <li>Choose a template or build your own MCP</li>
              <li>Run optimizations and review solutions</li>
              <li>Iterate, explain, and deploy!</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
} 