import React from 'react';

interface UnderDevelopmentProps {
  pageName: string;
}

const UnderDevelopment: React.FC<UnderDevelopmentProps> = ({ pageName }) => {
  return (
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
              {/* Code Lines Animation */}
              <div className="absolute inset-0 flex flex-col justify-center items-center space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 bg-blue-200/20 rounded"
                    style={{
                      width: `${Math.random() * 40 + 60}%`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-docs-text">{pageName}</h1>
            <p className="text-docs-muted text-center max-w-md">
              This page is currently under development. Our team is working hard to bring you an amazing experience.
              Check back soon for updates!
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
                  style={{ width: '60%' }}
                />
              </div>
            </div>

            {/* Features Coming */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-docs-muted">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-docs-muted">Custom Reports</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-docs-muted">Integration Tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderDevelopment; 