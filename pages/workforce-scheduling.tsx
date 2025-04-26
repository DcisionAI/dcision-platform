import Layout from '../components/Layout';

const features = [
  'Shift Pattern Optimization',
  'Break Scheduling',
  'Skills Matching',
  'Workload Balancing'
];

export default function WorkforceScheduling() {
  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] bg-docs-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-docs-section rounded-xl p-8 shadow-lg border border-docs-section-border">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Calendar Icon */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-40 h-40 text-blue-200/20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="animate-pulse" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12h.01M16 12h.01M8 12h.01M12 16h.01M16 16h.01M8 16h.01" className="animate-pulse" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-docs-text">Workforce Scheduling Optimization</h1>
              <p className="text-docs-muted text-center max-w-md">
                Our advanced workforce scheduling solution is under development. We're building powerful algorithms to optimize your staff schedules while respecting constraints and preferences.
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
                    style={{ width: '75%' }}
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
                    <span className="text-sm text-docs-muted">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-4 bg-blue-200/10 rounded-lg">
                <p className="text-sm text-docs-muted text-center">
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