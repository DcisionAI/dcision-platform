import { agnoClient, AgnoChatRequest } from '../../agno-client';
import type { MCPConfig } from '../mcp/MCPTypes';

export interface DynamicModelBuilderResult {
  mcpConfig: MCPConfig;
  confidence: number;
  reasoning: string;
  modelType: 'LP' | 'MIP' | 'QP' | 'NLP';
  problemComplexity: 'basic' | 'intermediate' | 'advanced';
  variables: Array<{
    name: string;
    type: 'continuous' | 'integer' | 'binary';
    description: string;
    bounds?: { lower: number; upper: number };
  }>;
  constraints: Array<{
    name: string;
    description: string;
    type: 'linear' | 'quadratic' | 'nonlinear';
  }>;
  objective: {
    type: 'minimize' | 'maximize';
    description: string;
  };
}

/**
 * Robust JSON parsing function that handles various response formats
 */
function cleanAndParseJSON(jsonString: string): any {
  try {
    // First try to parse as-is
    return JSON.parse(jsonString);
  } catch (err) {
    // If that fails, try to clean up common issues
    let cleaned = jsonString;
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any text before the first {
    const startIndex = cleaned.indexOf('{');
    if (startIndex > 0) {
      cleaned = cleaned.substring(startIndex);
    }
    
    // Remove any text after the last }
    const endIndex = cleaned.lastIndexOf('}');
    if (endIndex > 0 && endIndex < cleaned.length - 1) {
      cleaned = cleaned.substring(0, endIndex + 1);
    }
    
    // If the JSON is truncated, try to complete it
    if (!cleaned.endsWith('}')) {
      // Count opening and closing braces
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += '}';
      }
    }
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (err2: any) {
      // If still failing, return null to trigger fallback
      console.warn('Failed to parse JSON after cleaning, will use fallback');
      console.log('Cleaned JSON string:', cleaned);
      return null;
    }
  }
}

export class DynamicModelBuilder {
  private modelProvider: 'anthropic' | 'openai';
  private modelName: string;

  constructor(
    modelProvider: 'anthropic' | 'openai' = 'anthropic',
    modelName?: string
  ) {
    this.modelProvider = modelProvider;
    this.modelName = modelName || (modelProvider === 'openai' ? (process.env.MODEL_BUILDER_MODEL || 'gpt-4o') : 'claude-3-5-sonnet-20241022');
  }

  /**
   * Build a dynamic optimization model from user input and enriched data
   */
  async buildDynamicModel(
    userInput: string,
    enrichedData: any,
    intent: any
  ): Promise<DynamicModelBuilderResult> {
    try {
      console.log('🔄 Dynamic Model Builder: Starting model generation');
      console.log('📝 User Input:', userInput);
      console.log('📊 Enriched Data:', enrichedData);
      console.log('🎯 Intent:', intent);

      // Step 1: Generate model structure using AI
      const modelStructure = await this.generateModelStructure(userInput, enrichedData, intent);
      
      // Step 2: Validate and refine the model
      const validatedModel = await this.validateAndRefineModel(modelStructure, enrichedData);
      
      // Step 3: Convert to MCP format
      const mcpConfig = this.convertToMCPFormat(validatedModel);

      return {
        mcpConfig,
        confidence: validatedModel.confidence,
        reasoning: validatedModel.reasoning,
        modelType: validatedModel.modelType,
        problemComplexity: validatedModel.problemComplexity,
        variables: validatedModel.variables,
        constraints: validatedModel.constraints,
        objective: validatedModel.objective
      };

    } catch (error: any) {
      console.error('❌ Dynamic Model Builder Error:', error);
      throw new Error(`Failed to build dynamic model: ${error.message}`);
    }
  }

  /**
   * Generate model structure using AI
   */
  private async generateModelStructure(
    userInput: string,
    enrichedData: any,
    intent: any
  ): Promise<any> {
    const prompt = this.buildModelGenerationPrompt(userInput, enrichedData, intent);
    
    const request: AgnoChatRequest = {
      message: prompt,
      model_provider: this.modelProvider,
      model_name: this.modelName,
      context: {
        system_prompt: `You are an expert optimization model builder with deep knowledge of mathematical programming, operations research, and constraint optimization. Your task is to analyze user requirements and create a complete, solvable optimization model.

IMPORTANT REQUIREMENTS:
1. Create a NON-TRIVIAL optimization problem with meaningful variables and constraints
2. Ensure the problem is SOLVABLE (not unbounded or infeasible)
3. Use appropriate variable types (continuous, integer, binary)
4. Create realistic bounds and constraints
5. Use meaningful objective coefficients that represent actual costs/values
6. Ensure all constraints are mathematically consistent
7. Provide detailed reasoning for your model design

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. The JSON must be properly formatted and complete.

IMPORTANT RULES:
1. All string values must be properly quoted.
2. All arrays must be properly formatted with square brackets.
3. All numbers must not be quoted.
4. Return ONLY the JSON structure below, no additional text.

RESPONSE FORMAT:
Return ONLY this JSON structure:
{
  "modelType": "LP|MIP|QP|NLP",
  "problemComplexity": "basic|intermediate|advanced",
  "variables": [
    {
      "name": "variable_name",
      "type": "continuous|integer|binary",
      "description": "What this variable represents",
      "bounds": {"lower": 0, "upper": 100}
    }
  ],
  "constraints": [
    {
      "name": "constraint_name",
      "description": "What this constraint enforces",
      "coefficients": [1, 2, 3],
      "variables": ["var1", "var2", "var3"],
      "operator": "<=|>=|=",
      "rhs": 10
    }
  ],
  "objective": {
    "type": "minimize|maximize",
    "description": "What we're optimizing for",
    "coefficients": [1, 2, 3],
    "variables": ["var1", "var2", "var3"]
  },
  "confidence": 0.9,
  "reasoning": "Detailed explanation of model design decisions"
}`
      }
    };

    const response = await agnoClient.chat(request);
    
    // Log response details for debugging
    console.log('Dynamic Model Builder response received:');
    console.log('Response type:', typeof response.response);
    console.log('Response length:', typeof response.response === 'string' ? response.response.length : 'N/A');
    
    if (typeof response.response === 'string' && response.response.length > 200) {
      console.log('Response preview:', response.response.substring(0, 200) + '...');
    } else {
      console.log('Full response:', response.response);
    }
    
    try {
      let modelStructure: any;
      
      if (typeof response.response === 'object' && response.response !== null) {
        console.log('Response is already an object, using directly');
        modelStructure = response.response;
      } else if (typeof response.response === 'string') {
        console.log('Attempting to parse string response...');
        modelStructure = cleanAndParseJSON(response.response);
        
        if (!modelStructure) {
          throw new Error('Failed to parse JSON after cleaning');
        }
        console.log('Successfully parsed JSON response');
      } else {
        throw new Error('Response is not a string or a valid JSON object');
      }
      
      console.log('✅ Generated model structure:', modelStructure);
      return modelStructure;
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse model structure:', parseError);
      console.error('Raw response:', response.response);
      throw new Error(`Failed to parse AI-generated model: ${parseError.message}`);
    }
  }

  /**
   * Build comprehensive prompt for model generation
   */
  private buildModelGenerationPrompt(
    userInput: string,
    enrichedData: any,
    intent: any
  ): string {
    return `Please create a complete optimization model for the following problem:

USER REQUEST:
${userInput}

ENRICHED DATA:
${JSON.stringify(enrichedData, null, 2)}

INTENT ANALYSIS:
${JSON.stringify(intent, null, 2)}

REQUIREMENTS:
1. Create variables that represent the key decision points in this problem
2. Define constraints that capture all business rules and limitations
3. Create an objective function that aligns with the stated goal
4. Ensure the model is mathematically sound and solvable
5. Use realistic bounds and coefficients
6. Make the model specific to this exact problem, not a generic template

CONSTRAINTS TO AVOID:
- Don't create conflicting constraints (e.g., x ≤ 10 AND x ≥ 15)
- Don't use arbitrary coefficients without meaning
- Don't create unbounded problems
- Don't ignore key requirements from the user input

Please generate a complete, solvable optimization model in the specified JSON format.`;
  }

  /**
   * Validate and refine the generated model
   */
  private async validateAndRefineModel(
    modelStructure: any,
    enrichedData: any
  ): Promise<any> {
    const validationPrompt = this.buildValidationPrompt(modelStructure, enrichedData);
    
    const request: AgnoChatRequest = {
      message: validationPrompt,
      model_provider: this.modelProvider,
      model_name: this.modelName,
      context: {
        system_prompt: `You are an expert optimization model validator. Your task is to validate and refine optimization models to ensure they are mathematically sound and solvable.

VALIDATION CRITERIA:
1. Mathematical feasibility - all constraints can be satisfied simultaneously
2. Proper variable bounds - no unbounded variables
3. Meaningful objective coefficients - represent actual costs/values
4. Constraint consistency - no conflicting constraints
5. Problem completeness - all requirements are captured

If the model is valid, return it unchanged with confidence 0.9+.
If the model has issues, fix them and return the corrected version with confidence 0.7+.
If the model is fundamentally flawed, create a new valid model with confidence 0.5+.

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. The JSON must be properly formatted and complete.

Return the validated model in the same JSON format.`
      }
    };

    const response = await agnoClient.chat(request);
    
    // Log response details for debugging
    console.log('Model validation response received:');
    console.log('Response type:', typeof response.response);
    console.log('Response length:', typeof response.response === 'string' ? response.response.length : 'N/A');
    
    try {
      let validatedModel: any;
      
      if (typeof response.response === 'object' && response.response !== null) {
        console.log('Validation response is already an object, using directly');
        validatedModel = response.response;
      } else if (typeof response.response === 'string') {
        console.log('Attempting to parse validation response...');
        validatedModel = cleanAndParseJSON(response.response);
        
        if (!validatedModel) {
          console.warn('Failed to parse validation response, returning original model');
          return modelStructure;
        }
        console.log('Successfully parsed validation response');
      } else {
        console.warn('Unexpected validation response type, returning original model');
        return modelStructure;
      }
      
      console.log('✅ Validated model:', validatedModel);
      return validatedModel;
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse validated model:', parseError);
      console.error('Raw validation response:', response.response);
      // Return original model if validation fails
      return modelStructure;
    }
  }

  /**
   * Build validation prompt
   */
  private buildValidationPrompt(modelStructure: any, enrichedData: any): string {
    return `Please validate and refine this optimization model:

GENERATED MODEL:
${JSON.stringify(modelStructure, null, 2)}

ENRICHED DATA:
${JSON.stringify(enrichedData, null, 2)}

Please check for:
1. Mathematical feasibility
2. Proper variable bounds
3. Meaningful objective coefficients
4. Constraint consistency
5. Problem completeness

If issues are found, fix them and return the corrected model.
If the model is valid, return it unchanged.`;
  }

  /**
   * Convert validated model to MCP format
   */
  private convertToMCPFormat(validatedModel: any): MCPConfig {
    // Convert variables
    const variables = validatedModel.variables.map((v: any) => ({
      name: v.name,
      type: v.type === 'integer' ? 'int' : v.type === 'binary' ? 'binary' : 'continuous',
      lower_bound: v.bounds?.lower || 0,
      upper_bound: v.bounds?.upper || (v.type === 'binary' ? 1 : Infinity),
      description: v.description
    }));

    // Convert constraints
    const constraints = {
      dense: validatedModel.constraints.map((c: any) => ({
        name: c.name,
        coefficients: c.coefficients,
        variables: c.variables,
        operator: c.operator,
        rhs: c.rhs,
        description: c.description
      })),
      sparse: []
    };

    // Convert objective
    const objective = {
      name: validatedModel.objective.description,
      sense: validatedModel.objective.type,
      coefficients: validatedModel.objective.coefficients,
      variables: validatedModel.objective.variables,
      description: validatedModel.objective.description
    };

    // Create solver config based on model type
    const solver_config = {
      time_limit: 300,
      gap_tolerance: 0.01,
      construction_heuristics: true,
      ...(validatedModel.modelType === 'MIP' && { presolve: 'on', cuts: 'on' }),
      ...(validatedModel.modelType === 'QP' && { qcp_diving: 'on' })
    };

    return {
      variables,
      constraints,
      objective,
      solver_config,
      problem_type: this.determineProblemType(validatedModel) as any
    };
  }

  /**
   * Determine problem type from model characteristics
   */
  private determineProblemType(validatedModel: any): string {
    const hasBinaryVars = validatedModel.variables.some((v: any) => v.type === 'binary');
    const hasIntegerVars = validatedModel.variables.some((v: any) => v.type === 'integer');
    const hasQuadraticTerms = validatedModel.constraints.some((c: any) => c.type === 'quadratic');
    
    if (hasQuadraticTerms) return 'quadratic_programming';
    if (hasBinaryVars) return 'binary_programming';
    if (hasIntegerVars) return 'integer_programming';
    return 'linear_programming';
  }
}

export const dynamicModelBuilder = new DynamicModelBuilder(); 