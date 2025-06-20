import Layout from '@/components/Layout';

const sections = [
  { id: 'api-key', label: 'Get your API key' },
  { id: 'connect-data', label: 'Connect your data' },
  { id: 'submit-workflow', label: 'Submit a decision workflow' },
  { id: 'review-results', label: 'Review results and explanations' },
  { id: 'iterate', label: 'Iterate, explain, and deploy' },
];

const codeRequest = `
POST /api/decision
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "workflow": "fleet_optimization",
  "data": {
    "vehicles": [...],
    "jobs": [...],
    "constraints": {...}
  }
}
`.trim();

const codeResponse = `
{
  "status": "success",
  "solution": {
    "routes": [...],
    "total_distance": 1234,
    "details": {...}
  },
  "explanation": "Optimal routes generated using AgentAI Decision Workflow."
}
`.trim();

function QuickstartTOC() {
  return (
    <nav className="hidden xl:block fixed right-8 top-32 w-64 z-10">
      <div className="bg-docs-section border border-docs-section-border rounded-lg p-4">
        <div className="text-xs text-docs-muted font-bold mb-2 uppercase tracking-wider">On this page</div>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-docs-muted hover:text-docs-accent text-xs transition"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default function Quickstart() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex relative">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold mb-4 text-docs-text">Quickstart</h1>
          <p className="mb-8 text-docs-muted">
            Get started with AgentAI Decision Workflows in just a few steps. Use our API to automate, optimize, and explain your business decisions.
          </p>
          <ol className="space-y-8">
            <li id="api-key">
              <div className="flex items-center mb-2">
                <span className="bg-docs-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">1</span>
                <span className="text-lg text-docs-text font-semibold">Get your API key</span>
              </div>
              <p className="text-docs-muted ml-12">Sign up and generate an API key from your DcisionAI dashboard.</p>
            </li>
            <li id="connect-data">
              <div className="flex items-center mb-2">
                <span className="bg-docs-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">2</span>
                <span className="text-lg text-docs-text font-semibold">Connect your data or define your MCP</span>
              </div>
              <p className="text-docs-muted ml-12">Upload your data or use our templates to define your Model-Context-Protocol (MCP).</p>
            </li>
            <li id="submit-workflow">
              <div className="flex items-center mb-2">
                <span className="bg-docs-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">3</span>
                <span className="text-lg text-docs-text font-semibold">Submit a decision workflow</span>
              </div>
              <p className="text-docs-muted ml-12 mb-2">Make an API call to submit your workflow. Example:</p>
              <div className="ml-12 bg-docs-section border border-docs-section-border rounded-lg p-4 font-mono text-xs text-docs-text overflow-x-auto">
                <pre>{codeRequest}</pre>
              </div>
            </li>
            <li id="review-results">
              <div className="flex items-center mb-2">
                <span className="bg-docs-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">4</span>
                <span className="text-lg text-docs-text font-semibold">Review results and explanations</span>
              </div>
              <p className="text-docs-muted ml-12 mb-2">You'll receive a solution and an explanation. Example response:</p>
              <div className="ml-12 bg-docs-section border border-docs-section-border rounded-lg p-4 font-mono text-xs text-docs-text overflow-x-auto">
                <pre>{codeResponse}</pre>
              </div>
            </li>
            <li id="iterate">
              <div className="flex items-center mb-2">
                <span className="bg-docs-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">5</span>
                <span className="text-lg text-docs-text font-semibold">Iterate, explain, and deploy</span>
              </div>
              <p className="text-docs-muted ml-12">Use AgentAI to refine your workflows, generate explanations, and deploy solutions to production.</p>
            </li>
          </ol>
        </div>
        <div className="w-72 flex-shrink-0">
          <QuickstartTOC />
        </div>
      </div>
    </Layout>
  );
} 