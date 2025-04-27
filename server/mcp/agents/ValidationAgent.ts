import { Step, StepResult } from '../types';
import { OrchestrationContext } from '../../orchestrator/OrchestrationContext';
import OpenAI from 'openai';
import config from '../../config/openai';

interface ValidationScenario {
  name: string;
  description: string;
  modifiedParameters: Record<string, any>;
  expectedImpact: {
    metrics: Record<string, any>;
    risks: string[];
    opportunities: string[];
  };
}

interface SensitivityAnalysis {
  parameter: string;
  range: { min: number; max: number; step: number };
  impact: {
    metrics: Record<string, any>[];
    threshold: number;
    criticalPoints: number[];
  };
}

interface EnhancedValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: {
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    implementationComplexity: 'easy' | 'medium' | 'complex';
    estimatedImpact: number;
  }[];
  scenarios?: ValidationScenario[];
  sensitivityAnalysis?: SensitivityAnalysis[];
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigations: string[];
  };
  qualityMetrics: {
    completeness: number;
    consistency: number;
    reliability: number;
  };
}

export class ValidationAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  public async execute(step: Step, context: OrchestrationContext): Promise<StepResult> {
    try {
      const { validationType = 'constraints', data, rules, options = {} } = step.config || {};
      
      if (!data || !rules) {
        return {
          success: false,
          error: 'Missing data or rules in step config'
        };
      }

      let validationResult: EnhancedValidationResult;
      switch (validationType) {
        case 'constraints':
          validationResult = await this.validateConstraints(data, rules, options);
          break;
        case 'business_rules':
          validationResult = await this.validateBusinessRules(data, rules, options);
          break;
        case 'data_relationships':
          validationResult = await this.validateRelationships(data, rules, options);
          break;
        case 'feasibility':
          validationResult = await this.validateFeasibility(data, rules, options);
          break;
        case 'scenario_analysis':
          validationResult = await this.performScenarioAnalysis(data, rules, options);
          break;
        case 'sensitivity':
          validationResult = await this.performSensitivityAnalysis(data, rules, options);
          break;
        default:
          return {
            success: false,
            error: `Unsupported validation type: ${validationType}`
          };
      }

      // Perform additional risk assessment if not already included
      if (!validationResult.riskAssessment) {
        validationResult.riskAssessment = await this.assessRisks(data, rules, validationResult);
      }

      return {
        success: validationResult.isValid,
        error: validationResult.isValid ? undefined : validationResult.errors.join('; '),
        outputs: {
          validationDetails: validationResult,
          qualityMetrics: validationResult.qualityMetrics,
          riskAssessment: validationResult.riskAssessment,
          scenarios: validationResult.scenarios,
          sensitivityAnalysis: validationResult.sensitivityAnalysis
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during validation'
      };
    }
  }

  private async performScenarioAnalysis(
    data: any,
    rules: any[],
    options: Record<string, any>
  ): Promise<EnhancedValidationResult> {
    const prompt = `Perform scenario analysis for the optimization problem:
    1. Generate relevant scenarios
    2. Assess impact on key metrics
    3. Identify risks and opportunities
    4. Suggest mitigation strategies
    
    Data: ${JSON.stringify(data, null, 2)}
    Rules: ${JSON.stringify(rules, null, 2)}
    Options: ${JSON.stringify(options, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in scenario analysis for optimization problems. Generate comprehensive scenarios and assess their impacts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async performSensitivityAnalysis(
    data: any,
    rules: any[],
    options: Record<string, any>
  ): Promise<EnhancedValidationResult> {
    const prompt = `Perform sensitivity analysis for the optimization problem:
    1. Identify key parameters
    2. Define parameter ranges
    3. Analyze impact on objectives
    4. Identify critical thresholds
    
    Data: ${JSON.stringify(data, null, 2)}
    Rules: ${JSON.stringify(rules, null, 2)}
    Options: ${JSON.stringify(options, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sensitivity analysis for optimization problems. Provide detailed analysis of parameter impacts and thresholds.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async assessRisks(
    data: any,
    rules: any[],
    validationResult: EnhancedValidationResult
  ): Promise<{
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigations: string[];
  }> {
    const prompt = `Assess risks for the optimization solution:
    1. Evaluate risk factors
    2. Determine overall risk level
    3. Suggest mitigation strategies
    4. Consider validation results
    
    Data: ${JSON.stringify(data, null, 2)}
    Rules: ${JSON.stringify(rules, null, 2)}
    Validation Results: ${JSON.stringify(validationResult, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in risk assessment for optimization solutions. Provide comprehensive risk analysis and mitigation strategies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async validateConstraints(data: any, rules: any[], options: Record<string, any>): Promise<EnhancedValidationResult> {
    const prompt = `Validate the following data against the specified constraints:
    1. Check each constraint rule
    2. Identify violations
    3. Suggest possible fixes
    4. Assess overall feasibility
    
    Data: ${JSON.stringify(data, null, 2)}
    Constraints: ${JSON.stringify(rules, null, 2)}
    Options: ${JSON.stringify(options, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in validating optimization constraints. Return a detailed analysis in JSON format with isValid, errors, and suggestions fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No validation result received from OpenAI');
    }
    return JSON.parse(content) as EnhancedValidationResult;
  }

  private async validateBusinessRules(data: any, rules: any[], options: Record<string, any>): Promise<EnhancedValidationResult> {
    const prompt = `Validate the following data against business rules:
    1. Check each business rule
    2. Identify rule violations
    3. Assess impact on business objectives
    4. Suggest compliant alternatives
    
    Data: ${JSON.stringify(data, null, 2)}
    Business Rules: ${JSON.stringify(rules, null, 2)}
    Options: ${JSON.stringify(options, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in business rule validation. Return a detailed analysis in JSON format with isValid, errors, and suggestions fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No validation result received from OpenAI');
    }
    return JSON.parse(content) as EnhancedValidationResult;
  }

  private async validateRelationships(data: any, rules: any[], options: Record<string, any>): Promise<EnhancedValidationResult> {
    const prompt = `Validate data relationships and dependencies:
    1. Check entity relationships
    2. Verify referential integrity
    3. Identify inconsistencies
    4. Suggest relationship fixes
    
    Data: ${JSON.stringify(data, null, 2)}
    Relationship Rules: ${JSON.stringify(rules, null, 2)}
    Options: ${JSON.stringify(options, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in validating data relationships. Return a detailed analysis in JSON format with isValid, errors, and suggestions fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No validation result received from OpenAI');
    }
    return JSON.parse(content) as EnhancedValidationResult;
  }

  private async validateFeasibility(data: any, rules: any[], options: Record<string, any>): Promise<EnhancedValidationResult> {
    const prompt = `Assess solution feasibility:
    1. Check physical constraints
    2. Verify resource availability
    3. Evaluate timing constraints
    4. Analyze cost constraints
    
    Data: ${JSON.stringify(data, null, 2)}
    Feasibility Rules: ${JSON.stringify(rules, null, 2)}
    Options: ${JSON.stringify(options, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: config.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in assessing optimization solution feasibility. Return a detailed analysis in JSON format with isValid, errors, and suggestions fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No validation result received from OpenAI');
    }
    return JSON.parse(content) as EnhancedValidationResult;
  }
}

export function createValidationAgent(apiKey: string): (step: Step, context: OrchestrationContext) => Promise<StepResult> {
  const agent = new ValidationAgent(apiKey);
  return (step: Step, context: OrchestrationContext) => agent.execute(step, context);
} 