export interface Step {
  id: string;
  action: string;
  config?: {
    data?: Record<string, any>;
    [key: string]: any;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  timeout?: number;
}

export interface StepResult {
  success: boolean;
  error?: string;
  outputs?: {
    harmonizedData?: Record<string, any>;
    validation?: Record<string, any>;
    metadata?: Record<string, any>;
    explanation?: {
      summary: string;
      details: Record<string, any>;
      recommendations?: string[];
      visualizations?: string[];
    };
    validationDetails?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      metrics: Record<string, any>;
    };
    qualityMetrics?: Record<string, any>;
    riskAssessment?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      mitigations: string[];
    };
    scenarios?: Array<{
      name: string;
      description: string;
      modifiedParameters: Record<string, any>;
      expectedImpact: {
        metrics: Record<string, any>;
        risks: string[];
        opportunities: string[];
      };
    }>;
    sensitivityAnalysis?: Array<{
      parameter: string;
      range: { min: number; max: number; step: number };
      impact: {
        metrics: Record<string, any>[];
        threshold: number;
        criticalPoints: number[];
      };
    }>;
  };
} 