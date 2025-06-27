import { messageBus } from './MessageBus';
import { openai } from '../lib/openai-client';

// Rate limiting and retry utilities
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error?.status === 429) {
        const retryAfter = parseInt(error.headers?.['retry-after-ms'] || error.headers?.['retry-after']) || baseDelay;
        console.warn(`Rate limit hit, retrying in ${retryAfter}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        continue;
      }
      
      // For other errors, use exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`OpenAI API error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

// Subscribe to trigger_critique event for comprehensive workflow critique
messageBus.subscribe('trigger_critique', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`🔍 CritiqueAgent starting comprehensive critique for session: ${correlationId}`);
  
  try {
    const workflowData = msg.payload;
    
    // Create comprehensive critique prompt
    const critiquePrompt = `You are an expert AI system reviewer. Please provide a comprehensive critique of the following complete workflow solution:

WORKFLOW DATA:
- Intent Analysis: ${JSON.stringify(workflowData.intent, null, 2)}
- Enriched Data: ${JSON.stringify(workflowData.enrichedData, null, 2)}
- Model Configuration: ${JSON.stringify(workflowData.model, null, 2)}
- Solution: ${JSON.stringify(workflowData.solution, null, 2)}
- Explanation: ${JSON.stringify(workflowData.explanation, null, 2)}

Please provide a detailed critique covering:
1. **Strengths**: What was done well?
2. **Weaknesses**: What could be improved?
3. **Potential Issues**: Any concerns or risks?
4. **Recommendations**: Specific suggestions for improvement
5. **Overall Assessment**: Quality score (1-10) with reasoning

Be thorough but constructive in your analysis.`;

    const critique = await withRetry(async () => {
      return await openai.chat({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert AI system reviewer specializing in optimization workflows and agentic AI systems. Provide thorough, constructive critiques.' 
          },
          { 
            role: 'user', 
            content: critiquePrompt 
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });
    });

    const critiqueResult = {
      critique: critique.choices[0].message.content,
      timestamp: new Date().toISOString(),
      workflowStep: 'comprehensive_review',
      agent: 'CritiqueAgent'
    };

    // Publish critique ready event
    messageBus.publish({ 
      type: 'critique_ready', 
      payload: critiqueResult, 
      correlationId 
    });

    // Publish critique complete event to continue workflow
    messageBus.publish({ 
      type: 'critique_complete', 
      payload: critiqueResult, 
      correlationId 
    });

    console.log(`✅ CritiqueAgent completed critique for session: ${correlationId}`);

  } catch (error: any) {
    console.error(`❌ CritiqueAgent error for session: ${correlationId}:`, error);
    
    // Publish error but continue workflow
    messageBus.publish({ 
      type: 'critique_complete', 
      payload: { 
        critique: 'Critique failed due to technical error, but workflow continues.',
        error: error.message,
        timestamp: new Date().toISOString()
      }, 
      correlationId 
    });
  }
});

// Legacy event subscriptions for backward compatibility
['model_built', 'solution_found'].forEach((eventType) => {
  messageBus.subscribe(eventType, async (msg) => {
    try {
      const critiquePrompt = `You are an expert reviewer. Please critique the following output from the agent (${eventType}):\n${JSON.stringify(msg.payload)}\nWhat are the strengths, weaknesses, and possible improvements?`;
      
      const critique = await withRetry(async () => {
        return await openai.chat({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert agent output reviewer.' },
            { role: 'user', content: critiquePrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        });
      });
      
      messageBus.publish({ 
        type: 'critique_ready', 
        payload: { critique: critique.choices[0].message.content }, 
        correlationId: msg.correlationId 
      });
    } catch (error: any) {
      console.error(`❌ CritiqueAgent legacy error for ${eventType}:`, error);
      messageBus.publish({ 
        type: 'critique_ready', 
        payload: { 
          critique: 'Critique unavailable due to technical limitations.',
          error: error.message
        }, 
        correlationId: msg.correlationId 
      });
    }
  });
}); 