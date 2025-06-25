import { agnoClient, AgnoChatRequest } from '../../agno-client';
import type { MCPConfig } from '../mcp/MCPTypes';
import { templateLoader } from '../../../../../templates/optimization';
import { OptimizationTemplate } from '../../../../../templates/optimization/types';
import { dynamicModelBuilder, DynamicModelBuilderResult } from './dynamicModelBuilder';
import { getModelConfig, ModelConfig } from '../../config/modelConfig';

export interface EnhancedModelBuilderResult {
  mcpConfig: MCPConfig;
  confidence: number;
  reasoning: string;
  approach: 'dynamic_ai' | 'template_based' | 'fallback';
  modelType: 'LP' | 'MIP' | 'QP' | 'NLP';
  problemComplexity: 'basic' | 'intermediate' | 'advanced';
  templateUsed?: string;
  customizations?: Record<string, any>;
}

export class EnhancedModelBuilder {
  private modelConfig: ModelConfig;

  constructor(
    modelProvider?: 'anthropic' | 'openai',
    modelName?: string,
    useGPT4oMini?: boolean
  ) {
    // Use configuration system with optional overrides
    this.modelConfig = getModelConfig('modelBuilderAgent');
    
    if (modelProvider) {
      this.modelConfig.provider = modelProvider;
    }
    if (modelName) {
      this.modelConfig.modelName = modelName;
    }
    if (useGPT4oMini !== undefined) {
      this.modelConfig.useGPT4oMini = useGPT4oMini;
    }
    
    console.log('Enhanced Model Builder initialized with:', {
      provider: this.modelConfig.provider,
      model: this.modelConfig.modelName,
      useGPT4oMini: this.modelConfig.useGPT4oMini
    });
  }

  /**
   * Build an optimization model using multiple strategies
   */
  async buildModel(
    userInput: string,
    enrichedData: any,
    intent: any
  ): Promise<EnhancedModelBuilderResult> {
    console.log('🚀 Enhanced Model Builder: Starting multi-strategy model generation');
    console.log('📝 User Input:', userInput);
    console.log('🎯 Intent:', intent);

    // Strategy 1: Try dynamic AI generation first
    try {
      console.log('🔄 Strategy 1: Attempting dynamic AI generation');
      const dynamicResult = await this.attemptDynamicGeneration(userInput, enrichedData, intent);
      
      if (dynamicResult && dynamicResult.confidence >= 0.7) {
        console.log('✅ Dynamic AI generation successful');
        return {
          mcpConfig: dynamicResult.mcpConfig,
          confidence: dynamicResult.confidence,
          reasoning: dynamicResult.reasoning,
          approach: 'dynamic_ai',
          modelType: dynamicResult.modelType,
          problemComplexity: dynamicResult.problemComplexity
        };
      }
    } catch (error) {
      console.warn('⚠️ Dynamic AI generation failed:', error);
    }

    // Strategy 2: Try template-based approach
    try {
      console.log('🔄 Strategy 2: Attempting template-based generation');
      const templateResult = await this.attemptTemplateGeneration(enrichedData, intent);
      
      if (templateResult && templateResult.confidence >= 0.6) {
        console.log('✅ Template-based generation successful');
        return {
          mcpConfig: templateResult.mcpConfig,
          confidence: templateResult.confidence,
          reasoning: templateResult.reasoning,
          approach: 'template_based',
          modelType: templateResult.modelType || 'MIP',
          problemComplexity: templateResult.problemComplexity || 'intermediate',
          templateUsed: templateResult.templateUsed,
          customizations: templateResult.customizations
        };
      }
    } catch (error) {
      console.warn('⚠️ Template-based generation failed:', error);
    }

    // Strategy 3: Fallback to AI-generated generic model
    console.log('🔄 Strategy 3: Using AI-generated fallback');
    const fallbackResult = await this.generateFallbackModel(userInput, enrichedData, intent);
    
    return {
      mcpConfig: fallbackResult.mcpConfig,
      confidence: fallbackResult.confidence,
      reasoning: fallbackResult.reasoning,
      approach: 'fallback',
      modelType: fallbackResult.modelType || 'MIP',
      problemComplexity: fallbackResult.problemComplexity || 'basic'
    };
  }

  /**
   * Attempt dynamic AI generation
   */
  private async attemptDynamicGeneration(
    userInput: string,
    enrichedData: any,
    intent: any
  ): Promise<DynamicModelBuilderResult | null> {
    try {
      const dynamicBuilder = new (dynamicModelBuilder.constructor as any)(
        this.modelConfig.provider,
        this.modelConfig.modelName
      );
      
      return await dynamicBuilder.buildDynamicModel(userInput, enrichedData, intent);
    } catch (error) {
      console.error('Dynamic generation failed:', error);
      return null;
    }
  }

  /**
   * Attempt template-based generation
   */
  private async attemptTemplateGeneration(
    enrichedData: any,
    intent: any
  ): Promise<any> {
    // Select best template based on intent
    const template = this.selectBestTemplate(intent);
    if (!template) {
      return null;
    }

    // Extract customizations from enriched data
    const customizations = this.extractCustomizations(enrichedData, intent);
    
    // Convert template to MCP format
    const mcpConfig = this.convertTemplateToMCP(template, customizations);
    
    if (this.isSolvableMCPConfig(mcpConfig)) {
      return {
        mcpConfig,
        confidence: 0.8,
        reasoning: `Successfully generated model using template: ${template.name}`,
        templateUsed: template.template_id,
        customizations,
        modelType: template.problem_type === 'MIP' ? 'MIP' : 'LP',
        problemComplexity: template.metadata?.complexity || 'intermediate'
      };
    }

    return null;
  }

  /**
   * Generate fallback model using AI
   */
  private async generateFallbackModel(
    userInput: string,
    enrichedData: any,
    intent: any
  ): Promise<any> {
    const prompt = `Create a simple but valid optimization model for this problem:

USER REQUEST: ${userInput}

INTENT: ${JSON.stringify(intent, null, 2)}

Create a basic optimization model with:
- 3-5 meaningful variables
- 2-4 realistic constraints  
- A clear objective function
- Proper bounds and coefficients

Return as JSON with variables, constraints, and objective.`;

    const request: AgnoChatRequest = {
      message: prompt,
      model_provider: this.modelConfig.provider,
      model_name: this.modelConfig.modelName,
      context: {
        system_prompt: `You are an optimization expert. Create simple, valid optimization models. Return only JSON.`
      }
    };

    try {
      const response = await agnoClient.chat(request);
      const content = response.response;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const model = JSON.parse(jsonMatch[0]);
        const mcpConfig = this.convertToMCPFormat(model);
        
        return {
          mcpConfig,
          confidence: 0.4,
          reasoning: 'Generated basic fallback model using AI',
          modelType: 'MIP',
          problemComplexity: 'basic'
        };
      }
    } catch (error) {
      console.error('Fallback generation failed:', error);
    }

    // Ultimate fallback: return a simple crew assignment model
    return {
      mcpConfig: this.createSimpleFallbackModel(),
      confidence: 0.2,
      reasoning: 'Using simple fallback model',
      modelType: 'MIP',
      problemComplexity: 'basic'
    };
  }

  /**
   * Select best template based on intent
   */
  private selectBestTemplate(intent: any): OptimizationTemplate | null {
    const templates = templateLoader.getAllTemplates();
    
    // Match based on optimization type
    if (intent?.optimizationType) {
      const matchingTemplate = templates.find(t => 
        t.template_id.includes(intent.optimizationType.toLowerCase())
      );
      if (matchingTemplate) return matchingTemplate;
    }

    // Match based on keywords
    const keywords = intent?.keywords || [];
    for (const keyword of keywords) {
      const matchingTemplate = templates.find(t => 
        t.template_id.includes(keyword.toLowerCase()) ||
        t.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matchingTemplate) return matchingTemplate;
    }

    // Default to crew assignment
    return templates.find(t => t.template_id.includes('crew')) || templates[0];
  }

  /**
   * Extract customizations from enriched data
   */
  private extractCustomizations(enrichedData: any, intent: any): Record<string, any> {
    const customizations: Record<string, any> = {};
    
    // Extract parameters from intent
    if (intent?.extractedParameters) {
      customizations.parameters = intent.extractedParameters;
    }
    
    // Extract budget constraints
    if (enrichedData?.costs?.total_budget) {
      customizations.parameters = {
        ...customizations.parameters,
        budget_limit: enrichedData.costs.total_budget
      };
    }
    
    // Extract time constraints
    if (enrichedData?.timeline?.deadline) {
      customizations.parameters = {
        ...customizations.parameters,
        time_limit: enrichedData.timeline.deadline
      };
    }
    
    return customizations;
  }

  /**
   * Convert template to MCP format
   */
  private convertTemplateToMCP(template: OptimizationTemplate, customizations?: Record<string, any>): MCPConfig {
    // Apply customizations if provided
    const customizedTemplate = customizations ? this.customizeTemplate(template, customizations) : template;
    
    // Convert variables
    const variables = customizedTemplate.variables.map(v => ({
      name: v.name,
      type: (v.type === 'int' ? 'int' : v.type === 'bin' ? 'binary' : 'continuous') as 'int' | 'binary' | 'continuous',
      lower_bound: v.bounds.lower,
      upper_bound: v.bounds.upper,
      description: v.description
    }));

    // Convert constraints
    const constraints = {
      dense: customizedTemplate.constraints.dense.map((row, index) => ({
        name: `constraint_${index}`,
        coefficients: row,
        variables: customizedTemplate.variables.map(v => v.name),
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
      variables: customizedTemplate.variables.map(v => v.name),
      description: customizedTemplate.objective.description
    };

    return {
      variables,
      constraints,
      objective,
      solver_config: customizedTemplate.solver_config || {
        time_limit: 300,
        gap_tolerance: 0.01,
        construction_heuristics: true
      },
      problem_type: 'resource_allocation' as any
    };
  }

  /**
   * Customize template with parameters
   */
  private customizeTemplate(template: OptimizationTemplate, customizations: Record<string, any>): OptimizationTemplate {
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
    
    return customized;
  }

  /**
   * Convert AI-generated model to MCP format
   */
  private convertToMCPFormat(model: any): MCPConfig {
    // Convert variables
    const variables = model.variables?.map((v: any) => ({
      name: v.name,
      type: v.type === 'integer' ? 'int' : v.type === 'binary' ? 'binary' : 'continuous',
      lower_bound: v.bounds?.lower || 0,
      upper_bound: v.bounds?.upper || (v.type === 'binary' ? 1 : Infinity),
      description: v.description
    })) || [];

    // Convert constraints
    const constraints = {
      dense: model.constraints?.map((c: any) => ({
        name: c.name,
        coefficients: c.coefficients,
        variables: c.variables,
        operator: c.operator,
        rhs: c.rhs,
        description: c.description
      })) || [],
      sparse: []
    };

    // Convert objective
    const objective = {
      name: model.objective?.description || 'minimize_objective',
      sense: model.objective?.type || 'minimize',
      coefficients: model.objective?.coefficients || [],
      variables: model.objective?.variables || [],
      description: model.objective?.description || 'Minimize objective'
    };

    return {
      variables,
      constraints,
      objective,
      solver_config: {
        time_limit: 300,
        gap_tolerance: 0.01,
        construction_heuristics: true
      },
      problem_type: 'resource_allocation' as any
    };
  }

  /**
   * Create simple fallback model
   */
  private createSimpleFallbackModel(): MCPConfig {
    return {
      variables: [
        {
          name: 'workers',
          type: 'int',
          lower_bound: 1,
          upper_bound: 10,
          description: 'Number of workers'
        },
        {
          name: 'hours',
          type: 'continuous',
          lower_bound: 0,
          upper_bound: 40,
          description: 'Working hours'
        }
      ],
      constraints: {
        dense: [
          {
            name: 'min_workers',
            coefficients: [1, 0],
            variables: ['workers', 'hours'],
            operator: '>=',
            rhs: 2,
            description: 'Minimum workers required'
          },
          {
            name: 'max_hours',
            coefficients: [0, 1],
            variables: ['workers', 'hours'],
            operator: '<=',
            rhs: 40,
            description: 'Maximum hours allowed'
          }
        ],
        sparse: []
      },
      objective: {
        name: 'minimize_cost',
        sense: 'minimize',
        coefficients: [25, 1],
        variables: ['workers', 'hours'],
        description: 'Minimize total cost'
      },
      solver_config: {
        time_limit: 300,
        gap_tolerance: 0.01,
        construction_heuristics: true
      },
      problem_type: 'resource_allocation' as any
    };
  }

  /**
   * Validate MCP config
   */
  private isSolvableMCPConfig(config: MCPConfig): boolean {
    return !!(
      config.variables &&
      config.variables.length > 0 &&
      config.constraints &&
      config.objective
    );
  }
}

export const enhancedModelBuilder = new EnhancedModelBuilder(); 