import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FieldMapping {
  databaseField: string;
  requiredField: string;
  confidence: number;
  transformations?: string[];
  rationale: string;
  heuristicScore?: {
    score: number;
    confidence: number;
    rationale: string;
    transformations?: string[];
  };
}

interface AgentResponse {
  success: boolean;
  fieldRequirements: {
    required_fields: Record<string, any>;
    nice_to_have_fields?: Record<string, any>;
  };
  mappings: FieldMapping[];
  unmappedFields: string[];
  suggestedActions: string[];
  needsHumanReview: boolean;
  heuristicAnalysis: {
    totalFields: number;
    mappedFields: number;
    highConfidenceMappings: number;
    suggestedTransformations: number;
    fieldPatterns: {
      commonPatterns: string[];
      suggestedImprovements: string[];
      confidenceDistribution: {
        high: number;
        medium: number;
        low: number;
      };
    };
  };
  formattedResponse: string;
}

interface AgentResponseProps {
  response: AgentResponse;
}

export default function AgentResponse({ response }: AgentResponseProps) {
  // Helper function to safely parse mappings
  const parseMappings = (mappings: any): FieldMapping[] => {
    // If mappings is an array-like object (with numeric keys), convert it to array
    if (typeof mappings === 'object' && !Array.isArray(mappings)) {
      mappings = Object.values(mappings);
    }

    // Ensure mappings is an array
    if (!Array.isArray(mappings)) {
      console.error('Expected mappings to be an array or array-like object');
      return [];
    }

    return mappings.map((mapping: any) => {
      if (typeof mapping === 'string') {
        try {
          return JSON.parse(mapping);
        } catch (e) {
          console.error('Failed to parse mapping string:', e);
          return {
            databaseField: '',
            requiredField: '',
            confidence: 0,
            rationale: 'Invalid mapping format'
          };
        }
      }
      
      // Ensure mapping has all required fields
      const parsedMapping: FieldMapping = {
        databaseField: mapping.databaseField || '',
        requiredField: mapping.requiredField || '',
        confidence: typeof mapping.confidence === 'number' ? mapping.confidence : 0,
        transformations: Array.isArray(mapping.transformations) ? mapping.transformations : [],
        rationale: mapping.rationale || '',
      };

      // Handle heuristic score if present
      if (mapping.heuristicScore) {
        parsedMapping.heuristicScore = {
          score: typeof mapping.heuristicScore.score === 'number' ? mapping.heuristicScore.score : 0,
          confidence: typeof mapping.heuristicScore.confidence === 'number' ? mapping.heuristicScore.confidence : 0,
          rationale: mapping.heuristicScore.rationale || '',
          transformations: Array.isArray(mapping.heuristicScore.transformations) ? mapping.heuristicScore.transformations : []
        };
      }

      return parsedMapping;
    });
  };

  const parsedMappings = parseMappings(response.mappings);

  // Helper function to format confidence score
  const formatConfidence = (score: number) => {
    return `${(score * 100).toFixed(0)}%`;
  };

  // Helper function to get confidence class
  const getConfidenceClass = (score: number) => {
    if (score >= 0.9) return 'bg-green-500/20 text-green-500';
    if (score >= 0.7) return 'bg-yellow-500/20 text-yellow-500';
    return 'bg-red-500/20 text-red-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {response.success ? (
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          ) : (
            <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
          )}
          <h2 className="text-xl font-semibold text-white">
            Data Mapping Analysis
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            response.needsHumanReview ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
          }`}>
            {response.needsHumanReview ? 'Needs Review' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Fields</div>
          <div className="text-2xl font-semibold text-white">{response.heuristicAnalysis.totalFields}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Mapped Fields</div>
          <div className="text-2xl font-semibold text-white">{response.heuristicAnalysis.mappedFields}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">High Confidence</div>
          <div className="text-2xl font-semibold text-white">{response.heuristicAnalysis.highConfidenceMappings}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Needs Transformation</div>
          <div className="text-2xl font-semibold text-white">{response.heuristicAnalysis.suggestedTransformations}</div>
        </div>
      </div>

      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Required Fields</h3>
        <div className="space-y-3">
          {Object.entries(response.fieldRequirements.required_fields).map(([field, details]) => (
            <div key={field} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{field}</span>
                <span className="text-gray-400 text-sm">Type: {details.data_type}</span>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                {details.description}
              </div>
              {details.validation && details.validation.length > 0 && (
                <div className="mt-2 text-sm text-blue-400">
                  Validation: {details.validation.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optional Fields */}
      {response.fieldRequirements.nice_to_have_fields && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Optional Fields</h3>
          <div className="space-y-3">
            {Object.entries(response.fieldRequirements.nice_to_have_fields).map(([field, details]) => (
              <div key={field} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{field}</span>
                  <span className="text-gray-400 text-sm">Type: {details.data_type}</span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {details.description}
                </div>
                {details.benefits && details.benefits.length > 0 && (
                  <div className="mt-2 text-sm text-green-400">
                    Benefits: {details.benefits.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Mappings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Field Mappings</h3>
        <div className="space-y-3">
          {parsedMappings.map((mapping, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">{mapping.requiredField}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-white">{mapping.databaseField}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceClass(mapping.confidence)}`}>
                    {formatConfidence(mapping.confidence)} Confidence
                  </span>
                  {mapping.heuristicScore && (
                    <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceClass(mapping.heuristicScore.score)}`}>
                      {formatConfidence(mapping.heuristicScore.score)} Heuristic
                    </span>
                  )}
                </div>
              </div>
              {mapping.transformations && mapping.transformations.length > 0 && (
                <div className="mt-2 text-sm text-blue-400">
                  Transformations: {mapping.transformations.join(', ')}
                </div>
              )}
              <div className="mt-2 text-sm text-gray-400">
                Mapping: {mapping.rationale}
              </div>
              {mapping.heuristicScore && (
                <div className="mt-2 text-sm text-gray-400">
                  Heuristic Analysis: {mapping.heuristicScore.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unmapped Fields */}
      {response.unmappedFields.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Unmapped Fields</h3>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1 text-red-400">
              {response.unmappedFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Suggested Actions</h3>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <ul className="list-disc list-inside space-y-1 text-blue-400">
            {response.suggestedActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Field Patterns */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Field Patterns</h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Common Patterns</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {response.heuristicAnalysis.fieldPatterns.commonPatterns.map((pattern, index) => (
                <li key={index}>{pattern}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Suggested Improvements</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {response.heuristicAnalysis.fieldPatterns.suggestedImprovements.map((improvement, index) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 