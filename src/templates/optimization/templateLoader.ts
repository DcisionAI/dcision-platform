import fs from 'fs';
import path from 'path';
import { 
  OptimizationTemplate, 
  TemplateRecommendation, 
  TemplateSearchCriteria 
} from './types.ts';

export class TemplateLoader {
  private templatesDir: string;
  private templates: Map<string, OptimizationTemplate> = new Map();

  constructor(templatesDir: string = path.join(process.cwd(), 'src/templates/optimization')) {
    this.templatesDir = templatesDir;
    this.loadTemplates();
  }

  private loadTemplates(): void {
    try {
      const files = fs.readdirSync(this.templatesDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'README.md');
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const template: OptimizationTemplate = JSON.parse(content);
        
        this.templates.set(template.template_id, template);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): OptimizationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): OptimizationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by domain
   */
  getTemplatesByDomain(domain: string): OptimizationTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.metadata.domain === domain
    );
  }

  /**
   * Get templates by complexity level
   */
  getTemplatesByComplexity(complexity: 'basic' | 'intermediate' | 'advanced'): OptimizationTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.metadata.complexity === complexity
    );
  }

  /**
   * Get templates by problem type
   */
  getTemplatesByProblemType(problemType: string): OptimizationTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.problem_type === problemType
    );
  }

  /**
   * Search templates by tags
   */
  searchTemplatesByTags(tags: string[]): OptimizationTemplate[] {
    return this.getAllTemplates().filter(template => 
      tags.some(tag => template.metadata.tags.includes(tag))
    );
  }

  /**
   * Get template recommendations based on intent
   */
  getTemplateRecommendations(intent: string, domain?: string): TemplateRecommendation[] {
    const allTemplates = domain 
      ? this.getTemplatesByDomain(domain)
      : this.getAllTemplates();

    // Simple keyword matching for intent classification
    const intentLower = intent.toLowerCase();
    
    const recommendations: TemplateRecommendation[] = [];
    
    allTemplates.forEach(template => {
      const templateText = `${template.name} ${template.description} ${template.metadata.tags.join(' ')}`.toLowerCase();
      let score = 0;
      let reasoning = '';
      
      // Score based on exact matches
      if (templateText.includes(intentLower)) {
        score += 10;
        reasoning += 'Exact intent match; ';
      }
      
      // Score based on tag matches
      const tagMatches = template.metadata.tags.filter(tag => intentLower.includes(tag));
      if (tagMatches.length > 0) {
        score += tagMatches.length * 5;
        reasoning += `Tag matches: ${tagMatches.join(', ')}; `;
      }
      
      // Score based on domain relevance
      if (domain && template.metadata.domain === domain) {
        score += 3;
        reasoning += 'Domain match; ';
      }
      
      if (score > 0) {
        recommendations.push({
          template,
          score,
          reasoning: reasoning.trim()
        });
      }
    });
    
    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Search templates using criteria
   */
  searchTemplates(criteria: TemplateSearchCriteria): OptimizationTemplate[] {
    let templates = this.getAllTemplates();
    
    if (criteria.domain) {
      templates = templates.filter(t => t.metadata.domain === criteria.domain);
    }
    
    if (criteria.complexity) {
      templates = templates.filter(t => t.metadata.complexity === criteria.complexity);
    }
    
    if (criteria.problemType) {
      templates = templates.filter(t => t.problem_type === criteria.problemType);
    }
    
    if (criteria.tags && criteria.tags.length > 0) {
      templates = templates.filter(t => 
        criteria.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }
    
    if (criteria.intent) {
      const recommendations = this.getTemplateRecommendations(criteria.intent, criteria.domain);
      const templateIds = recommendations.map(r => r.template.template_id);
      templates = templates.filter(t => templateIds.includes(t.template_id));
    }
    
    return templates;
  }

  /**
   * Validate a template
   */
  validateTemplate(template: OptimizationTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!template.template_id) errors.push('Missing template_id');
    if (!template.name) errors.push('Missing name');
    if (!template.description) errors.push('Missing description');
    if (!template.problem_type) errors.push('Missing problem_type');
    if (!template.sense) errors.push('Missing sense');
    if (!template.variables || template.variables.length === 0) errors.push('Missing or empty variables');
    if (!template.constraints) errors.push('Missing constraints');
    if (!template.objective) errors.push('Missing objective');
    if (!template.metadata) errors.push('Missing metadata');

    // Check variable structure
    if (template.variables) {
      template.variables.forEach((variable, index) => {
        if (!variable.name) errors.push(`Variable ${index}: Missing name`);
        if (!variable.type) errors.push(`Variable ${index}: Missing type`);
        if (!variable.bounds) errors.push(`Variable ${index}: Missing bounds`);
      });
    }

    // Check constraints structure
    if (template.constraints) {
      const { dense, sense, rhs } = template.constraints;
      if (!dense || !sense || !rhs) {
        errors.push('Constraints missing dense, sense, or rhs');
      } else if (dense.length !== sense.length || dense.length !== rhs.length) {
        errors.push('Constraints: dense, sense, and rhs arrays must have same length');
      }
    }

    // Check objective structure
    if (template.objective) {
      const { linear, quadratic } = template.objective;
      if (!linear && !quadratic) {
        errors.push('Objective must have either linear or quadratic coefficients');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reload templates from disk
   */
  reloadTemplates(): void {
    this.templates.clear();
    this.loadTemplates();
  }

  /**
   * Select the best template for a given intent
   */
  selectBestTemplate(intent: any): OptimizationTemplate | null {
    if (!intent || !intent.decisionType) {
      return null;
    }

    const intentType = intent.decisionType.toLowerCase();
    const allTemplates = this.getAllTemplates();
    
    // Find exact matches first
    const exactMatches = allTemplates.filter(template => 
      template.problem_type.toLowerCase() === intentType ||
      template.metadata.tags.some(tag => tag.toLowerCase() === intentType)
    );

    if (exactMatches.length > 0) {
      // Return the first exact match (could be enhanced with scoring)
      return exactMatches[0];
    }

    // Find partial matches
    const partialMatches = allTemplates.filter(template => 
      template.problem_type.toLowerCase().includes(intentType) ||
      intentType.includes(template.problem_type.toLowerCase()) ||
      template.metadata.tags.some(tag => 
        tag.toLowerCase().includes(intentType) || 
        intentType.includes(tag.toLowerCase())
      )
    );

    if (partialMatches.length > 0) {
      return partialMatches[0];
    }

    // No suitable template found
    return null;
  }
}

// Export singleton instance
export const templateLoader = new TemplateLoader(); 