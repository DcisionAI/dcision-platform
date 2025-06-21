import { templateLoader } from './templateLoader';
import { OptimizationTemplate } from './types';

/**
 * Example: Enhanced ConstructionMCPSolver that uses templates
 */
export class EnhancedConstructionMCPSolver {
  
  /**
   * Get template-based optimization problem
   */
  async getTemplateBasedProblem(
    intent: string,
    parameters?: Record<string, any>
  ): Promise<OptimizationTemplate | null> {
    
    // Get template recommendations based on intent
    const recommendations = templateLoader.getTemplateRecommendations(intent, 'construction');
    
    if (recommendations.length === 0) {
      console.log('No templates found for intent:', intent);
      return null;
    }
    
    // Get the best matching template
    const bestTemplate = recommendations[0].template;
    console.log(`Selected template: ${bestTemplate.name} (score: ${recommendations[0].score})`);
    
    // Customize template with parameters
    return this.customizeTemplate(bestTemplate, parameters);
  }
  
  /**
   * Customize template with user parameters
   */
  private customizeTemplate(
    template: OptimizationTemplate, 
    parameters?: Record<string, any>
  ): OptimizationTemplate {
    if (!parameters) {
      return template;
    }
    
    // Create a deep copy of the template
    const customized = JSON.parse(JSON.stringify(template));
    
    // Update parameters if provided
    if (parameters.budget_limit) {
      customized.parameters = {
        ...customized.parameters,
        budget_limit: parameters.budget_limit
      };
    }
    
    if (parameters.time_limit) {
      customized.parameters = {
        ...customized.parameters,
        time_limit: parameters.time_limit
      };
    }
    
    // Update constraint RHS values based on parameters
    if (parameters.constraints) {
      customized.constraints.rhs = parameters.constraints.map((value: number, index: number) => 
        value || customized.constraints.rhs[index]
      );
    }
    
    // Update objective coefficients based on parameters
    if (parameters.objective_coefficients) {
      if (customized.objective.linear) {
        customized.objective.linear = parameters.objective_coefficients;
      }
    }
    
    return customized;
  }
  
  /**
   * Convert template to MCP format
   */
  convertTemplateToMCP(template: OptimizationTemplate): any {
    return {
      model: {
        variables: template.variables.map(v => ({
          name: v.name,
          type: v.type,
          lb: v.bounds.lower,
          ub: v.bounds.upper
        })),
        constraints: template.constraints.dense.map((row, index) => ({
          name: `constraint_${index}`,
          coefficients: row,
          sense: template.constraints.sense[index],
          rhs: template.constraints.rhs[index]
        })),
        objective: {
          sense: template.sense,
          coefficients: template.objective.linear || [],
          quadratic: template.objective.quadratic
        }
      },
      parameters: template.parameters,
      solver_config: template.solver_config,
      metadata: {
        template_id: template.template_id,
        name: template.name,
        description: template.description
      }
    };
  }
  
  /**
   * Get available template categories
   */
  getTemplateCategories(): string[] {
    const templates = templateLoader.getAllTemplates();
    const categories = new Set<string>();
    
    templates.forEach(template => {
      template.metadata.tags.forEach(tag => categories.add(tag));
    });
    
    return Array.from(categories).sort();
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): OptimizationTemplate[] {
    return templateLoader.searchTemplatesByTags([category]);
  }
}

// Example usage
export async function exampleUsage() {
  const solver = new EnhancedConstructionMCPSolver();
  
  // Example 1: Get crew assignment template
  console.log('=== Example 1: Crew Assignment ===');
  const crewTemplate = await solver.getTemplateBasedProblem('crew assignment workforce scheduling');
  if (crewTemplate) {
    console.log('Template found:', crewTemplate.name);
    console.log('Variables:', crewTemplate.variables.length);
    console.log('Constraints:', crewTemplate.constraints.dense.length);
  }
  
  // Example 2: Get cost optimization template with parameters
  console.log('\n=== Example 2: Cost Optimization ===');
  const costTemplate = await solver.getTemplateBasedProblem('cost optimization', {
    budget_limit: 50000,
    time_limit: 30,
    constraints: [200, 20, 100] // Override constraint RHS values
  });
  if (costTemplate) {
    console.log('Customized template:', costTemplate.name);
    console.log('Budget limit:', costTemplate.parameters?.budget_limit);
  }
  
  // Example 3: Get available categories
  console.log('\n=== Example 3: Available Categories ===');
  const categories = solver.getTemplateCategories();
  console.log('Categories:', categories);
  
  // Example 4: Get templates by category
  console.log('\n=== Example 4: Templates by Category ===');
  const schedulingTemplates = solver.getTemplatesByCategory('scheduling');
  console.log('Scheduling templates:', schedulingTemplates.map(t => t.name));
} 