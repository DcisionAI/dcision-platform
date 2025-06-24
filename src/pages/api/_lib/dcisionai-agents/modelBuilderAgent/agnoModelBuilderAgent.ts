// Agno-based Model Builder Agent for DcisionAI
// Now uses the real Agno Python backend for advanced AI capabilities

import { agnoClient, AgnoChatRequest } from '../../agno-client';
import type { MCPConfig } from '../mcp/MCPTypes';
import { templateLoader } from '../../../../../templates/optimization';
import { OptimizationTemplate, Variable } from '../../../../../templates/optimization/types';

export interface ModelBuilderResult {
  mcpConfig: MCPConfig;
  confidence: number;
  reasoning: string;
  templateUsed?: string;
  templateCustomizations?: Record<string, any>;
}

function isValidMCPConfig(obj: any): obj is MCPConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.variables) &&
    obj.variables.length > 0 && // Must have variables
    typeof obj.constraints === 'object' &&
    Array.isArray(obj.constraints?.dense) &&
    Array.isArray(obj.constraints?.sparse) &&
    typeof obj.objective === 'object' &&
    typeof obj.solver_config === 'object'
  );
}

function isSolvableMCPConfig(config: MCPConfig): boolean {
  try {
    // Check if variables array is meaningful
    if (!config.variables || config.variables.length === 0) {
      console.warn('MCP config has no variables');
      return false;
    }

    // Check if constraints are meaningful
    if (!config.constraints.dense || config.constraints.dense.length === 0) {
      console.warn('MCP config has no constraints');
      return false;
    }

    // Check if objective has non-zero coefficients
    const hasNonZeroCoefficients = config.objective.coefficients.some(coeff => coeff !== 0);
    if (!hasNonZeroCoefficients) {
      console.warn('MCP config objective has all zero coefficients');
      return false;
    }

    // Check if variable names match between variables and constraints
    const variableNames = config.variables.map(v => v.name);
    const objectiveVariables = config.objective.variables;
    const constraintVariables = config.constraints.dense.flatMap(c => c.variables);
    
    const allReferencedVariables = Array.from(new Set([...objectiveVariables, ...constraintVariables]));
    const allDefinedVariables = new Set(variableNames);
    
    for (const varName of allReferencedVariables) {
      if (!allDefinedVariables.has(varName)) {
        console.warn(`MCP config references undefined variable: ${varName}`);
        return false;
      }
    }

    // Check if coefficients arrays match variable arrays
    if (config.objective.coefficients.length !== config.objective.variables.length) {
      console.warn('MCP config objective coefficients length does not match variables length');
      return false;
    }

    for (const constraint of config.constraints.dense) {
      if (constraint.coefficients.length !== constraint.variables.length) {
        console.warn(`MCP config constraint ${constraint.name} coefficients length does not match variables length`);
        return false;
      }
    }

    // Check if bounds are reasonable
    for (const variable of config.variables) {
      if (variable.lower_bound >= variable.upper_bound) {
        console.warn(`MCP config variable ${variable.name} has invalid bounds: ${variable.lower_bound} >= ${variable.upper_bound}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating MCP config solvability:', error);
    return false;
  }
}

/**
 * Convert template to MCP format
 */
function convertTemplateToMCP(template: OptimizationTemplate, customizations?: Record<string, any>): MCPConfig {
  // Apply customizations if provided
  const customizedTemplate = customizations ? customizeTemplate(template, customizations) : template;
  
  // Convert variables
  const variables = customizedTemplate.variables.map((v: Variable) => ({
    name: v.name,
    type: (v.type === 'int' ? 'int' : v.type === 'bin' ? 'binary' : 'continuous') as 'continuous' | 'int' | 'binary',
    lower_bound: v.bounds.lower,
    upper_bound: v.bounds.upper,
    description: v.description
  }));

  // Convert constraints
  const constraints = {
    dense: customizedTemplate.constraints.dense.map((row: number[], index: number) => ({
      name: `constraint_${index}`,
      coefficients: row,
      variables: customizedTemplate.variables.map((v: Variable) => v.name),
      operator: customizedTemplate.constraints.sense[index] as '<=' | '>=' | '=',
      rhs: customizedTemplate.constraints.rhs[index],
      description: customizedTemplate.constraints.descriptions?.[index] || `Constraint ${index}`
    })),
    sparse: []
  };

  // Convert objective
  const objective = {
    name: customizedTemplate.objective.target,
    sense: customizedTemplate.sense as 'minimize' | 'maximize',
    coefficients: customizedTemplate.objective.linear || [],
    variables: customizedTemplate.variables.map((v: Variable) => v.name),
    description: customizedTemplate.objective.description
  };

  // Use template solver config or default
  const solver_config = customizedTemplate.solver_config || {
    time_limit: 300,
    gap_tolerance: 0.01,
    construction_heuristics: true
  };

  return {
    variables,
    constraints,
    objective,
    solver_config,
    problem_type: 'resource_allocation',
  };
}

/**
 * Customize template with user parameters
 */
function customizeTemplate(template: OptimizationTemplate, customizations: Record<string, any>): OptimizationTemplate {
  const customized = JSON.parse(JSON.stringify(template));
  
  // Update parameters
  if (customizations.parameters) {
    customized.parameters = {
      ...customized.parameters,
      ...customizations.parameters
    };
  }
  
  // Update constraint RHS values
  if (customizations.constraints) {
    customized.constraints.rhs = customizations.constraints.map((value: number, index: number) => 
      value !== undefined ? value : customized.constraints.rhs[index]
    );
  }
  
  // Update objective coefficients
  if (customizations.objective_coefficients) {
    if (customized.objective.linear) {
      customized.objective.linear = customizations.objective_coefficients;
    }
  }
  
  // Update variable bounds
  if (customizations.variable_bounds) {
    customized.variables.forEach((variable: Variable, index: number) => {
      if (customizations.variable_bounds[index]) {
        variable.bounds = {
          ...variable.bounds,
          ...customizations.variable_bounds[index]
        };
      }
    });
  }
  
  return customized;
}

/**
 * Select best template based on intent
 */
function selectBestTemplate(intent: any): OptimizationTemplate | null {
  try {
    // Get template recommendations from intent
    const templateIds = intent.templateRecommendations || [];
    
    // Try each recommended template
    for (const templateId of templateIds) {
      const template = templateLoader.getTemplate(templateId);
      if (template) {
        console.log(`Selected template: ${template.name} (${templateId})`);
        return template;
      }
    }
    
    // Fallback: search by optimization type
    if (intent.optimizationType) {
      const recommendations = templateLoader.getTemplateRecommendations(intent.optimizationType, 'construction');
      if (recommendations.length > 0) {
        const template = recommendations[0].template;
        console.log(`Selected template by type: ${template.name} (${template.template_id})`);
        return template;
      }
    }
    
    // Final fallback: get any construction template
    const constructionTemplates = templateLoader.getTemplatesByDomain('construction');
    if (constructionTemplates.length > 0) {
      const template = constructionTemplates[0];
      console.log(`Selected fallback template: ${template.name} (${template.template_id})`);
      return template;
    }
    
    return null;
  } catch (error) {
    console.error('Error selecting template:', error);
    return null;
  }
}

/**
 * Composes an MCPConfig directly from the enriched data provided by the data agent.
 * This is the primary method for dynamically building a model from user input.
 * @param enrichedData The simplified, flat JSON from the data agent.
 * @returns A valid MCPConfig or null if the data is insufficient.
 */
function composeMCPFromEnrichedData(enrichedData: any): MCPConfig | null {
  const { crews, tasks_or_phases, constraints: enriched_constraints, objective: objective_text } = enrichedData;

  if (!crews || !Array.isArray(crews) || crews.length === 0) {
    console.warn('Model Composer: Insufficient crew data to build a model.');
    return null;
  }

  // 1. Create Variables from Crews
  const variables = crews.map(crew => ({
    name: crew.type.toLowerCase().replace(/\\s/g, '_'),
    type: 'int' as 'int',
    lower_bound: 0,
    upper_bound: crew.count,
    description: `Number of ${crew.type} to assign.`
  }));

  if (variables.length === 0) return null;

  const totalWorkers = crews.reduce((sum, crew) => sum + crew.count, 0);

  // 2. Create Constraints
  const constraints = {
    dense: (enriched_constraints || []).map((c: any, i: number) => {
      let rhs = c.limit || c.min || 0;
      if (c.type === 'max_workers') {
        rhs = totalWorkers;
      }
      return {
        name: c.type || `constraint_${i}`,
        // For now, assume a simple structure. This can be made more robust.
        // This example assumes constraints apply to the sum of all crews.
        coefficients: variables.map(() => 1), 
        variables: variables.map(v => v.name),
        operator: c.limit ? '<=' as const : '>=' as const,
        rhs: rhs,
        description: c.type || 'A general constraint.'
      }
    }),
    sparse: [],
  };

  // 3. Create Objective Function
  const objective = {
    name: objective_text ? objective_text.toLowerCase().replace(/\\s/g, '_') : 'minimize_total_crew',
    sense: 'minimize' as 'minimize', // Defaulting to minimize, can be inferred from objective_text
    coefficients: variables.map(() => 1), // Simple objective: minimize total number of workers
    variables: variables.map(v => v.name),
    description: objective_text || 'Minimize the total number of assigned crew members.'
  };

  const mcpConfig: MCPConfig = {
    variables,
    constraints,
    objective,
    solver_config: {
      time_limit: 300,
      gap_tolerance: 0.01,
      construction_heuristics: true,
    },
    problem_type: 'resource_allocation',
  };

  // Final validation to ensure it's a coherent model
  if (isSolvableMCPConfig(mcpConfig)) {
    return mcpConfig;
  }

  console.warn('Model Composer: Composed MCP config was not solvable.');
  return null;
}

function createFallbackMCPConfig(enrichedData: any, intent: any): MCPConfig {
  console.warn('Creating fallback MCP config due to invalid response');
  
  // Extract basic info from enriched data with defensive checks
  const crews = enrichedData?.resources?.crews || [];
  const tasks = enrichedData?.timeline?.tasks || [];
  const costs = enrichedData?.costs || {};
  
  // Determine problem type from intent
  const decisionType = intent?.decisionType || 'unknown';
  const isCrewAssignment = decisionType.includes('crew') || decisionType.includes('resource') || decisionType.includes('assignment');
  const isScheduling = decisionType.includes('schedule') || decisionType.includes('timeline');
  const isCostOptimization = decisionType.includes('cost') || decisionType.includes('budget');
  
  let variables: Array<{
    name: string;
    type: 'continuous' | 'int' | 'binary';
    lower_bound: number;
    upper_bound: number;
    description: string;
  }> = [];
  
  let constraints: {
    dense: Array<{
      name: string;
      coefficients: number[];
      variables: string[];
      operator: '<=' | '>=' | '=';
      rhs: number;
      description: string;
    }>;
    sparse: any[];
  } = { dense: [], sparse: [] };
  
  let objective: {
    name: string;
    sense: 'minimize' | 'maximize';
    coefficients: number[];
    variables: string[];
    description: string;
  };

  // Create crew assignment problem (most common construction optimization)
  if (isCrewAssignment || decisionType === 'unknown') {
    // Variables for crew assignments
    variables = [
      {
        name: "carpenters_foundation",
        type: "int",
        lower_bound: 0,
        upper_bound: 10,
        description: "Number of carpenters assigned to foundation phase"
      },
      {
        name: "carpenters_framing",
        type: "int",
        lower_bound: 0,
        upper_bound: 10,
        description: "Number of carpenters assigned to framing phase"
      },
      {
        name: "carpenters_finishing",
        type: "int",
        lower_bound: 0,
        upper_bound: 10,
        description: "Number of carpenters assigned to finishing phase"
      },
      {
        name: "electricians_mep",
        type: "int",
        lower_bound: 0,
        upper_bound: 10,
        description: "Number of electricians assigned to MEP phase"
      },
      {
        name: "electricians_finishing",
        type: "int",
        lower_bound: 0,
        upper_bound: 10,
        description: "Number of electricians assigned to finishing phase"
      },
      {
        name: "plumbers_mep",
        type: "int",
        lower_bound: 0,
        upper_bound: 5,
        description: "Number of plumbers assigned to MEP phase"
      },
      {
        name: "hvac_mep",
        type: "int",
        lower_bound: 0,
        upper_bound: 5,
        description: "Number of HVAC technicians assigned to MEP phase"
      },
      {
        name: "project_duration",
        type: "continuous",
        lower_bound: 1,
        upper_bound: 365,
        description: "Total project duration in weeks"
      }
    ];

    // Constraints
    constraints.dense = [
      {
        name: "carpenter_availability",
        coefficients: [1, 1, 1, 0, 0, 0, 0, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: "<=",
        rhs: 15, // Total carpenters available
        description: "Total carpenters across all phases cannot exceed availability"
      },
      {
        name: "electrician_availability",
        coefficients: [0, 0, 0, 1, 1, 0, 0, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: "<=",
        rhs: 12, // Total electricians available
        description: "Total electricians across all phases cannot exceed availability"
      },
      {
        name: "plumber_availability",
        coefficients: [0, 0, 0, 0, 0, 1, 0, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: "<=",
        rhs: 6, // Total plumbers available
        description: "Total plumbers cannot exceed availability"
      },
      {
        name: "hvac_availability",
        coefficients: [0, 0, 0, 0, 0, 0, 1, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: "<=",
        rhs: 4, // Total HVAC technicians available
        description: "Total HVAC technicians cannot exceed availability"
      },
      {
        name: "foundation_minimum",
        coefficients: [1, 0, 0, 0, 0, 0, 0, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 3, // Minimum carpenters for foundation
        description: "Foundation phase requires minimum carpenters"
      },
      {
        name: "framing_minimum",
        coefficients: [0, 1, 0, 0, 0, 0, 0, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 4, // Minimum carpenters for framing
        description: "Framing phase requires minimum carpenters"
      },
      {
        name: "finishing_minimum",
        coefficients: [0, 0, 1, 0, 0, 0, 0, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 2, // Minimum carpenters for finishing
        description: "Finishing phase requires minimum carpenters"
      },
      {
        name: "mep_minimum",
        coefficients: [0, 0, 0, 1, 0, 1, 1, 0],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 8, // Minimum total MEP workers
        description: "MEP phase requires minimum total workers"
      },
      {
        name: "foundation_duration",
        coefficients: [0, 0, 0, 0, 0, 0, 0, 1],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 20, // Foundation takes at least 20 weeks with 3 carpenters
        description: "Foundation duration based on crew size"
      },
      {
        name: "framing_duration",
        coefficients: [0, 0, 0, 0, 0, 0, 0, 1],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 30, // Framing takes at least 30 weeks with 4 carpenters
        description: "Framing duration based on crew size"
      },
      {
        name: "mep_duration",
        coefficients: [0, 0, 0, 0, 0, 0, 0, 1],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 25, // MEP takes at least 25 weeks with 8 workers
        description: "MEP duration based on crew size"
      },
      {
        name: "finishing_duration",
        coefficients: [0, 0, 0, 0, 0, 0, 0, 1],
        variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
        operator: ">=",
        rhs: 15, // Finishing takes at least 15 weeks with 2 carpenters
        description: "Finishing duration based on crew size"
      }
    ];

    objective = {
      name: "minimize_duration",
      sense: "minimize",
      coefficients: [0, 0, 0, 0, 0, 0, 0, 1], // Only project_duration
      variables: ["carpenters_foundation", "carpenters_framing", "carpenters_finishing", "electricians_mep", "electricians_finishing", "plumbers_mep", "hvac_mep", "project_duration"],
      description: "Minimize total project duration"
    };

  } else if (isScheduling) {
    // Create scheduling problem
    variables = [
      {
        name: "task1_start",
        type: "continuous",
        lower_bound: 0,
        upper_bound: 100,
        description: "Start time of task 1"
      },
      {
        name: "task2_start",
        type: "continuous",
        lower_bound: 0,
        upper_bound: 100,
        description: "Start time of task 2"
      },
      {
        name: "task3_start",
        type: "continuous",
        lower_bound: 0,
        upper_bound: 100,
        description: "Start time of task 3"
      },
      {
        name: "project_completion",
        type: "continuous",
        lower_bound: 0,
        upper_bound: 200,
        description: "Project completion time"
      }
    ];

    constraints.dense = [
      {
        name: "task1_duration",
        coefficients: [1, 0, 0, -1],
        variables: ["task1_start", "task2_start", "task3_start", "project_completion"],
        operator: "<=",
        rhs: -5, // Task 1 takes 5 units
        description: "Task 1 duration constraint"
      },
      {
        name: "task2_duration",
        coefficients: [0, 1, 0, -1],
        variables: ["task1_start", "task2_start", "task3_start", "project_completion"],
        operator: "<=",
        rhs: -3, // Task 2 takes 3 units
        description: "Task 2 duration constraint"
      },
      {
        name: "task3_duration",
        coefficients: [0, 0, 1, -1],
        variables: ["task1_start", "task2_start", "task3_start", "project_completion"],
        operator: "<=",
        rhs: -4, // Task 3 takes 4 units
        description: "Task 3 duration constraint"
      },
      {
        name: "task2_after_task1",
        coefficients: [-1, 1, 0, 0],
        variables: ["task1_start", "task2_start", "task3_start", "project_completion"],
        operator: ">=",
        rhs: 5, // Task 2 starts after task 1 completes
        description: "Task dependency constraint"
      }
    ];

    objective = {
      name: "minimize_completion",
      sense: "minimize",
      coefficients: [0, 0, 0, 1], // Only project_completion
      variables: ["task1_start", "task2_start", "task3_start", "project_completion"],
      description: "Minimize project completion time"
    };

  } else {
    // Generic cost optimization problem
    variables = [
      {
        name: "project_duration",
        type: "continuous",
        lower_bound: 1,
        upper_bound: 365,
        description: "Total project duration in days"
      },
      {
        name: "total_cost",
        type: "continuous", 
        lower_bound: 0,
        upper_bound: 10000000,
        description: "Total project cost"
      },
      {
        name: "labor_cost",
        type: "continuous",
        lower_bound: 0,
        upper_bound: 5000000,
        description: "Labor cost component"
      },
      {
        name: "material_cost",
        type: "continuous",
        lower_bound: 0,
        upper_bound: 3000000,
        description: "Material cost component"
      }
    ];

    constraints.dense = [
      {
        name: "budget_constraint",
        coefficients: [0, 1, 0, 0],
        variables: ["project_duration", "total_cost", "labor_cost", "material_cost"],
        operator: "<=",
        rhs: costs.labor?.total_budget || 1000000,
        description: "Total cost must not exceed budget"
      },
      {
        name: "cost_breakdown",
        coefficients: [0, -1, 1, 1],
        variables: ["project_duration", "total_cost", "labor_cost", "material_cost"],
        operator: "=",
        rhs: 0,
        description: "Total cost equals labor plus materials"
      },
      {
        name: "duration_cost_relation",
        coefficients: [50, 0, -1, 0],
        variables: ["project_duration", "total_cost", "labor_cost", "material_cost"],
        operator: "<=",
        rhs: 0,
        description: "Labor cost increases with duration"
      }
    ];

    objective = {
      name: "minimize_cost",
      sense: "minimize",
      coefficients: [0, 1, 0, 0], // Only total_cost
      variables: ["project_duration", "total_cost", "labor_cost", "material_cost"],
      description: "Minimize total project cost"
    };
  }

  // Create solver config
  const solver_config = {
    time_limit: 300,
    gap_tolerance: 0.01,
    construction_heuristics: true
  };
  
  return {
    variables,
    constraints,
    objective,
    solver_config,
    problem_type: 'resource_allocation',
  };
}

export const agnoModelBuilderAgent = {
  name: 'Dr. Sarah Chen - Optimization PhD & Model Builder',
  description: 'Distinguished Optimization PhD with 15+ years experience in Operations Research, Mathematical Programming, and Industrial Engineering. Specializes in MILP, constraint programming, and advanced optimization techniques for construction and project management problems.',

  /**
   * Build an OR-Tools compatible optimization model (MCP config) from enriched data and intent.
   * @param enrichedData The data enriched by the Data Agent
   * @param intent The interpreted intent from the Intent Agent
   * @param sessionId Optional session ID for conversation continuity
   * @param modelProvider Optional model provider (anthropic or openai)
   * @param modelName Optional specific model name
   * @returns { mcpConfig }
   */
  async buildModel(
    enrichedData: any, 
    intent: any, 
    sessionId?: string,
    modelProvider: 'anthropic' | 'openai' = 'openai',
    modelName?: string
  ): Promise<ModelBuilderResult> {
    try {
      console.log('Model Builder: Received enriched data:', enrichedData);
      console.log('Model Builder: Received intent:', intent);

      // Use GPT-4o-mini by default for better performance and cost-effectiveness
      const defaultModelName = modelName || (modelProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022');
      console.log(`Model Builder: Using ${modelProvider} with model ${defaultModelName}`);

      // --- Primary Strategy: Compose model directly from enriched data ---
      if (enrichedData && Object.keys(enrichedData).length > 0) {
        const composedMCP = composeMCPFromEnrichedData(enrichedData.enrichedData);
        if (composedMCP) {
          console.log('Model Builder: Successfully composed MCP from enriched data.');
          return {
            mcpConfig: composedMCP,
            confidence: 0.9,
            reasoning: 'Successfully built a dynamic optimization model based on the user request.',
          };
        }
      }

      // --- Fallback Strategy: Use a template ---
      console.log('Model Builder: Could not compose from data, attempting template-based generation.');
      const template = selectBestTemplate(intent);

      if (template) {
        const customizations = this.extractCustomizations(enrichedData, intent);
        const mcpConfig = convertTemplateToMCP(template, customizations);
        
        if (isSolvableMCPConfig(mcpConfig)) {
          return {
            mcpConfig,
            confidence: 0.7,
            reasoning: `Successfully generated model using template: ${template.name}`,
            templateUsed: template.template_id,
            templateCustomizations: customizations,
          };
        }
      }

      // --- Final Fallback: Use the old fallback logic ---
      console.warn('Model Builder: Template-based model was not solvable. Using final fallback.');
      const fallbackConfig = createFallbackMCPConfig(enrichedData, intent);
      return {
        mcpConfig: fallbackConfig,
        confidence: 0.3,
        reasoning: 'Could not generate a specific model. Using a generic fallback.',
      };

    } catch (error: any) {
      console.error('An error occurred in the Model Builder Agent:', error);
      const fallbackConfig = createFallbackMCPConfig(enrichedData, intent);
      return {
        mcpConfig: fallbackConfig,
        confidence: 0.1,
        reasoning: `Model generation failed with an error: ${error.message}. A generic fallback model was used.`,
      };
    }
  },

  /**
   * Extract customizations from enriched data and intent
   */
  extractCustomizations(enrichedData: any, intent: any): Record<string, any> {
    const customizations: Record<string, any> = {};
    
    // Extract parameters from intent
    if (intent?.extractedParameters) {
      customizations.parameters = intent.extractedParameters;
    }
    
    // Extract budget constraints from enriched data
    if (enrichedData?.costs?.total_budget) {
      customizations.parameters = {
        ...customizations.parameters,
        budget_limit: enrichedData.costs.total_budget
      };
    }
    
    // Extract crew availability from enriched data
    if (enrichedData?.resources?.crews) {
      const crewConstraints: number[] = [];
      enrichedData.resources.crews.forEach((crew: any) => {
        if (crew.availability) {
          crewConstraints.push(crew.availability);
        }
      });
      if (crewConstraints.length > 0) {
        customizations.constraints = crewConstraints;
      }
    }
    
    // Extract time constraints from enriched data
    if (enrichedData?.timeline?.deadline) {
      customizations.parameters = {
        ...customizations.parameters,
        time_limit: enrichedData.timeline.deadline
      };
    }
    
    return customizations;
  },

  /**
   * Create a specialized construction model building agent
   * @param modelProvider Optional model provider
   * @param modelName Optional specific model name
   * @returns Agent ID
   */
  async createSpecializedAgent(
    modelProvider: 'anthropic' | 'openai' = 'openai',
    modelName?: string
  ): Promise<string> {
    const config = {
      name: 'Construction Model Builder Agent',
      instructions: `You are an expert construction optimization model builder specializing in:
- Mathematical programming and optimization theory
- OR-Tools and constraint programming
- Construction management optimization problems
- Resource allocation and scheduling models
- Cost optimization and budget management
- Risk assessment and mitigation modeling
- Multi-objective optimization and trade-off analysis
- Solver configuration and performance tuning

Your role is to translate construction management requirements into precise mathematical optimization models that can be solved efficiently using OR-Tools.`,
      model_provider: modelProvider,
      model_name: modelName || (modelProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022'),
      temperature: 0.1,
      markdown: true
    };

    const result = await agnoClient.createAgent(config);
    return result.agent_id;
  }
}; 