import { messageBus } from './MessageBus';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const critique = await openai.chat.completions.create({
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
    const critiquePrompt = `You are an expert reviewer. Please critique the following output from the agent (${eventType}):\n${JSON.stringify(msg.payload)}\nWhat are the strengths, weaknesses, and possible improvements?`;
    const critique = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert agent output reviewer.' },
        { role: 'user', content: critiquePrompt }
      ]
    });
    messageBus.publish({ type: 'critique_ready', payload: { critique: critique.choices[0].message.content }, correlationId: msg.correlationId });
  });
}); 