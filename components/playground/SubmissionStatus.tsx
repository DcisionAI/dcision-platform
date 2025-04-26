import React from 'react';

interface SubmissionResponse {
  status: string;
  jobId: string;
  problemType: string;
  estimatedTime: string;
  nextSteps: string[];
}

interface SubmissionStatusProps {
  response: SubmissionResponse | null;
  error: string | null;
}

export default function SubmissionStatus({ response, error }: SubmissionStatusProps) {
  if (!response && !error) return null;

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="text-red-800 font-semibold">Submission Failed</h3>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  // At this point, response must be non-null
  const submissionResponse = response as SubmissionResponse;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-blue-900 font-semibold">
          {submissionResponse.problemType} {submissionResponse.status === 'accepted' ? 'Accepted' : 'Processing'}
        </h3>
        <span className="text-sm text-blue-700">Job ID: {submissionResponse.jobId}</span>
      </div>
      
      <div className="mt-3">
        <p className="text-blue-800">
          Estimated completion time: {submissionResponse.estimatedTime}
        </p>
        
        <div className="mt-3">
          <h4 className="text-blue-900 font-medium mb-2">Next Steps:</h4>
          <ul className="space-y-1">
            {submissionResponse.nextSteps.map((step, index) => (
              <li key={index} className="flex items-center text-blue-800">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm mr-2">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 