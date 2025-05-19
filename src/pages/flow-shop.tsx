import UnderDevelopment from '@/components/UnderDevelopment';
import Layout from '@/components/Layout';

const features = [
  'Production Line Balancing',
  'Bottleneck Detection',
  'Sequence Optimization',
  'WIP Management'
];

export default function FlowShop() {
  return (
    <Layout>
      <div className="min-h-screen bg-docs-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Code Animation */}
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-32 w-32 text-blue-200" viewBox="0 0 24 24">
                    <path
                      className="opacity-20"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                    <path
                      className="opacity-60"
                      fill="currentColor"
                      d="M12 0v4a8 8 0 00-8 8H0C0 5.373 5.373 0 12 0z"
                    />
                  </svg>
                </div>
                {/* Assembly Line Animation */}
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                  <svg className="w-48 h-48 text-blue-200/20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" className="animate-pulse" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v16" className="animate-pulse" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 4v16" className="animate-pulse" />
                  </svg>
                </div>
              </div>

              <h1 className="text-xl font-bold text-docs-text">Flow Shop Scheduling</h1>
              <p className="text-sm text-docs-muted text-center max-w-md">
                Our flow shop scheduling solution is under development. We're building intelligent algorithms to optimize your production line efficiency and throughput.
              </p>

              {/* Development Progress */}
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-docs-muted mb-2">
                  <span>Development Progress</span>
                  <span>Coming Soon</span>
                </div>
                <div className="h-2 bg-docs-section-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-200 rounded-full animate-pulse"
                    style={{ width: '80%' }}
                  />
                </div>
              </div>

              {/* Features Coming */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-docs-muted">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-4 bg-blue-200/10 rounded-lg">
                <p className="text-xs text-docs-muted text-center">
                  Want early access? Contact our team at support@dcision.ai
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 