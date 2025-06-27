// Prompt optimization utilities to reduce token usage

export interface OptimizedPrompt {
  system: string;
  user: string;
  estimatedTokens: number;
  optimization: string;
}

export class PromptOptimizer {
  // Optimize system prompts for common agent roles
  static getOptimizedSystemPrompt(role: string): string {
    const optimizedPrompts: Record<string, string> = {
      'debate_trigger': 'Debate trigger evaluator. Respond YES/NO only.',
      'debate_moderator': 'Debate moderator. Generate concise challenges.',
      'debate_judge': 'Debate judge. Determine winner: agent name or TIE.',
      'critique_reviewer': 'AI system reviewer. Provide constructive critique.',
      'intent_analyzer': 'Intent analyzer. Classify decision type and confidence.',
      'data_enricher': 'Data enricher. Extract and validate parameters.',
      'model_builder': 'Model builder. Create optimization models.',
      'solver_executor': 'Solver executor. Execute mathematical optimization.',
      'explanation_generator': 'Explanation generator. Provide clear insights.'
    };
    
    return optimizedPrompts[role] || 'AI assistant. Provide concise responses.';
  }

  // Optimize user prompts by removing redundant information
  static optimizeUserPrompt(prompt: string, context: any): string {
    let optimized = prompt;
    
    // Remove verbose JSON formatting
    if (typeof context === 'object') {
      const essentialData = this.extractEssentialData(context);
      optimized = optimized.replace(JSON.stringify(context, null, 2), JSON.stringify(essentialData));
    }
    
    // Remove redundant instructions
    optimized = optimized.replace(/Please provide a detailed|comprehensive|thorough/gi, 'Provide');
    optimized = optimized.replace(/Be thorough but constructive/gi, 'Be constructive');
    optimized = optimized.replace(/Consider factors like:/gi, 'Consider:');
    
    // Limit response length instructions
    optimized = optimized.replace(/Provide a concise summary/gi, 'Summarize');
    optimized = optimized.replace(/Provide a detailed critique/gi, 'Critique');
    
    return optimized;
  }

  // Extract only essential data from context
  static extractEssentialData(context: any): any {
    if (!context || typeof context !== 'object') return context;
    
    const essential: any = {};
    
    // Keep only key fields
    const essentialFields = ['status', 'type', 'value', 'name', 'description', 'confidence'];
    
    for (const [key, value] of Object.entries(context)) {
      if (essentialFields.includes(key) || 
          (typeof value === 'string' && value.length < 100) ||
          (typeof value === 'number') ||
          (typeof value === 'boolean')) {
        essential[key] = value;
      }
    }
    
    return essential;
  }

  // Estimate token count (rough approximation)
  static estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Create optimized prompt with token estimation
  static createOptimizedPrompt(
    role: string, 
    userPrompt: string, 
    context?: any
  ): OptimizedPrompt {
    const systemPrompt = this.getOptimizedSystemPrompt(role);
    const optimizedUserPrompt = this.optimizeUserPrompt(userPrompt, context);
    
    const totalTokens = this.estimateTokens(systemPrompt + optimizedUserPrompt);
    
    return {
      system: systemPrompt,
      user: optimizedUserPrompt,
      estimatedTokens: totalTokens,
      optimization: `Reduced from ~${this.estimateTokens(userPrompt)} tokens`
    };
  }

  // Get debate-specific optimized prompts
  static getDebatePrompts() {
    return {
      trigger: this.createOptimizedPrompt(
        'debate_trigger',
        'Should this trigger debate? YES/NO: {payload}'
      ),
      challenge: this.createOptimizedPrompt(
        'debate_moderator',
        'Challenge this output: {payload}. Focus on weaknesses.'
      ),
      judge: this.createOptimizedPrompt(
        'debate_judge',
        'Winner: {history}. Respond with agent name or TIE.'
      )
    };
  }

  // Get critique-specific optimized prompts
  static getCritiquePrompts() {
    return {
      comprehensive: this.createOptimizedPrompt(
        'critique_reviewer',
        'Critique: {workflow}. Focus on strengths, weaknesses, recommendations.'
      ),
      simple: this.createOptimizedPrompt(
        'critique_reviewer',
        'Review: {output}. Key issues and improvements?'
      )
    };
  }
} 