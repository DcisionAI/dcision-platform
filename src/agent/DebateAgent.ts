import { messageBus } from './MessageBus';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DebateRound {
  agent: string;
  argument: string;
  timestamp: Date;
}

interface DebateSession {
  topic: string;
  rounds: DebateRound[];
  maxRounds: number;
  currentRound: number;
}

const activeDebates = new Map<string, DebateSession>();

// Subscribe to trigger_debate event for comprehensive workflow debate
messageBus.subscribe('trigger_debate', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`🗣️ DebateAgent starting comprehensive debate for session: ${correlationId}`);
  
  try {
    const workflowData = msg.payload;
    
    // Create debate topic based on the workflow
    const debateTopic = `Comprehensive workflow debate: ${workflowData.intent?.decisionType || 'Unknown'} optimization with ${workflowData.intent?.optimizationType || 'general'} approach`;
    
    // Create debate session
    const debateSession: DebateSession = {
      topic: debateTopic,
      rounds: [],
      maxRounds: 3,
      currentRound: 0
    };
    
    const debateId = `comprehensive_debate_${correlationId}`;
    activeDebates.set(debateId, debateSession);
    
    // Generate initial debate challenge
    const debatePrompt = `You are a debate moderator. Generate a comprehensive debate challenge for this complete workflow solution:

WORKFLOW DATA:
- Intent: ${JSON.stringify(workflowData.intent, null, 2)}
- Data: ${JSON.stringify(workflowData.enrichedData, null, 2)}
- Model: ${JSON.stringify(workflowData.model, null, 2)}
- Solution: ${JSON.stringify(workflowData.solution, null, 2)}
- Explanation: ${JSON.stringify(workflowData.explanation, null, 2)}

Generate a challenging debate question that addresses:
1. The overall approach and methodology
2. Potential alternative solutions
3. Risk assessment and mitigation
4. Implementation feasibility
5. Long-term implications

Be constructive but challenging.`;

    const challenge = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert debate moderator for AI optimization workflows.' 
        },
        { 
          role: 'user', 
          content: debatePrompt 
        }
      ],
      max_tokens: 500,
      temperature: 0.4
    });

    const initialChallenge = challenge.choices[0].message.content || 'No specific challenge generated.';
    
    debateSession.rounds.push({
      agent: 'DebateAgent',
      argument: initialChallenge,
      timestamp: new Date()
    });

    // Generate a comprehensive response from the "system" perspective
    const responsePrompt = `You are defending the complete workflow solution. Respond to this debate challenge:

CHALLENGE: ${initialChallenge}

WORKFLOW SOLUTION:
- Intent: ${JSON.stringify(workflowData.intent, null, 2)}
- Data: ${JSON.stringify(workflowData.enrichedData, null, 2)}
- Model: ${JSON.stringify(workflowData.model, null, 2)}
- Solution: ${JSON.stringify(workflowData.solution, null, 2)}
- Explanation: ${JSON.stringify(workflowData.explanation, null, 2)}

Provide a strong defense of the approach, addressing the challenge directly and explaining the rationale behind the decisions made.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are defending a comprehensive AI optimization workflow solution.' 
        },
        { 
          role: 'user', 
          content: responsePrompt 
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    debateSession.rounds.push({
      agent: 'WorkflowDefender',
      argument: response.choices[0].message.content || 'No defense provided.',
      timestamp: new Date()
    });

    debateSession.currentRound++;

    // Generate final counter-argument and conclusion
    const finalPrompt = `Based on this debate exchange, provide a final counter-argument and conclusion:

DEBATE HISTORY:
${debateSession.rounds.map(r => `${r.agent}: ${r.argument}`).join('\n\n')}

Provide:
1. A final counter-argument challenging the defense
2. A balanced conclusion weighing both sides
3. A recommendation for improvement
4. An overall assessment of the solution quality (1-10)`;

    const finalArgument = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are concluding a debate on AI optimization workflows.' 
        },
        { 
          role: 'user', 
          content: finalPrompt 
        }
      ],
      max_tokens: 600,
      temperature: 0.4
    });

    debateSession.rounds.push({
      agent: 'DebateAgent',
      argument: finalArgument.choices[0].message.content || 'No conclusion provided.',
      timestamp: new Date()
    });

    // Generate debate summary
    const summaryPrompt = `Summarize this debate and determine the winner:

DEBATE TOPIC: ${debateTopic}
DEBATE ROUNDS:
${debateSession.rounds.map((r, i) => `${i + 1}. ${r.agent}: ${r.argument.substring(0, 200)}...`).join('\n')}

Provide:
1. A concise summary of the key points
2. The winner (DebateAgent or WorkflowDefender)
3. Reasoning for the decision
4. Key insights from the debate`;

    const summary = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are summarizing and judging a debate on AI optimization workflows.' 
        },
        { 
          role: 'user', 
          content: summaryPrompt 
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const debateResult = {
      topic: debateTopic,
      participants: ['DebateAgent', 'WorkflowDefender'],
      winner: summary.choices[0].message.content?.includes('DebateAgent') ? 'DebateAgent' : 'WorkflowDefender',
      reasoning: summary.choices[0].message.content || 'No reasoning provided.',
      rounds: debateSession.rounds,
      timestamp: new Date().toISOString(),
      agent: 'DebateAgent'
    };

    // Publish debate result
    messageBus.publish({ 
      type: 'debate_result', 
      payload: debateResult, 
      correlationId 
    });

    // Publish debate complete event to continue workflow
    messageBus.publish({ 
      type: 'debate_complete', 
      payload: debateResult, 
      correlationId 
    });

    // Clean up
    activeDebates.delete(debateId);
    
    console.log(`✅ DebateAgent completed debate for session: ${correlationId}`);

  } catch (error: any) {
    console.error(`❌ DebateAgent error for session: ${correlationId}:`, error);
    
    // Publish error but continue workflow
    messageBus.publish({ 
      type: 'debate_complete', 
      payload: { 
        topic: 'Debate failed due to technical error',
        participants: [],
        winner: 'None',
        reasoning: 'Debate failed due to technical error, but workflow continues.',
        error: error.message,
        timestamp: new Date().toISOString()
      }, 
      correlationId 
    });
  }
});

// Listen for agent outputs that can be debated
['intent_identified', 'data_prepared', 'model_built', 'solution_found', 'explanation_ready'].forEach((eventType) => {
  messageBus.subscribe(eventType, async (msg) => {
    const debateId = `debate_${msg.correlationId}_${eventType}`;
    
    // Check if this output should trigger a debate
    const shouldDebate = await evaluateDebateTrigger(msg.payload, eventType);
    
    if (shouldDebate) {
      // Start a new debate session
      const debateSession: DebateSession = {
        topic: `${eventType}: ${JSON.stringify(msg.payload).substring(0, 100)}...`,
        rounds: [],
        maxRounds: 3,
        currentRound: 0
      };
      
      activeDebates.set(debateId, debateSession);
      
      // Generate initial challenge
      const challenge = await generateChallenge(msg.payload, eventType);
      debateSession.rounds.push({
        agent: 'DebateAgent',
        argument: challenge,
        timestamp: new Date()
      });
      
      // Publish debate started event
      messageBus.publish({
        type: 'debate_started',
        payload: {
          debateId,
          topic: debateSession.topic,
          challenge,
          originalAgent: eventType,
          originalOutput: msg.payload
        },
        correlationId: msg.correlationId
      });
      
      // Trigger response from the original agent
      messageBus.publish({
        type: `debate_response_${eventType}`,
        payload: {
          debateId,
          challenge,
          originalOutput: msg.payload
        },
        correlationId: msg.correlationId
      });
    }
  });
});

// Listen for debate responses from agents
['debate_response_intent_identified', 'debate_response_data_prepared', 'debate_response_model_built', 'debate_response_solution_found', 'debate_response_explanation_ready'].forEach((responseType) => {
  messageBus.subscribe(responseType, async (msg) => {
    const debateId = msg.payload.debateId;
    const debateSession = activeDebates.get(debateId);
    
    if (!debateSession) return;
    
    // Add agent's response to debate
    debateSession.rounds.push({
      agent: responseType.replace('debate_response_', ''),
      argument: msg.payload.response,
      timestamp: new Date()
    });
    
    debateSession.currentRound++;
    
    // Check if debate should continue
    if (debateSession.currentRound < debateSession.maxRounds) {
      // Generate counter-argument
      const counterArgument = await generateCounterArgument(
        debateSession.rounds,
        debateSession.topic
      );
      
      debateSession.rounds.push({
        agent: 'DebateAgent',
        argument: counterArgument,
        timestamp: new Date()
      });
      
      // Publish debate continuation
      messageBus.publish({
        type: 'debate_continued',
        payload: {
          debateId,
          counterArgument,
          round: debateSession.currentRound,
          totalRounds: debateSession.maxRounds
        },
        correlationId: msg.correlationId
      });
      
      // Trigger next response
      messageBus.publish({
        type: `debate_response_${responseType.replace('debate_response_', '')}`,
        payload: {
          debateId,
          challenge: counterArgument,
          previousRounds: debateSession.rounds
        },
        correlationId: msg.correlationId
      });
    } else {
      // End debate and generate summary
      const debateSummary = await generateDebateSummary(debateSession);
      
      messageBus.publish({
        type: 'debate_concluded',
        payload: {
          debateId,
          summary: debateSummary,
          rounds: debateSession.rounds,
          winner: await determineDebateWinner(debateSession)
        },
        correlationId: msg.correlationId
      });
      
      activeDebates.delete(debateId);
    }
  });
});

async function evaluateDebateTrigger(payload: any, eventType: string): Promise<boolean> {
  const prompt = `Evaluate if this agent output should trigger a debate:
Event: ${eventType}
Payload: ${JSON.stringify(payload)}

Consider factors like:
- Complexity of the decision
- Potential for alternative approaches
- Risk level of the solution
- Novelty of the approach

Respond with "YES" or "NO" only.`;
  
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a debate trigger evaluator.' },
      { role: 'user', content: prompt }
    ]
  });
  
  return result.choices[0].message.content?.trim() === 'YES';
}

async function generateChallenge(payload: any, eventType: string): Promise<string> {
  const prompt = `Generate a challenging question or counter-argument for this agent output:
Event: ${eventType}
Output: ${JSON.stringify(payload)}

Be constructive but challenging. Focus on potential weaknesses, alternative approaches, or areas that need more justification.`;
  
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a debate moderator challenging agent outputs.' },
      { role: 'user', content: prompt }
    ]
  });
  
  return result.choices[0].message.content || 'No specific challenge generated.';
}

async function generateCounterArgument(rounds: DebateRound[], topic: string): Promise<string> {
  const debateHistory = rounds.map(r => `${r.agent}: ${r.argument}`).join('\n');
  
  const prompt = `Based on this debate history, generate a counter-argument:
Topic: ${topic}
History:
${debateHistory}

Provide a strong counter-argument that challenges the most recent response.`;
  
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a debate moderator generating counter-arguments.' },
      { role: 'user', content: prompt }
    ]
  });
  
  return result.choices[0].message.content || 'No counter-argument generated.';
}

async function generateDebateSummary(debateSession: DebateSession): Promise<string> {
  const debateHistory = debateSession.rounds.map(r => `${r.agent}: ${r.argument}`).join('\n');
  
  const prompt = `Summarize this debate:
Topic: ${debateSession.topic}
Rounds: ${debateSession.rounds.length}
History:
${debateHistory}

Provide a concise summary of the key arguments, points of contention, and overall outcome.`;
  
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a debate summarizer.' },
      { role: 'user', content: prompt }
    ]
  });
  
  return result.choices[0].message.content || 'No summary generated.';
}

async function determineDebateWinner(debateSession: DebateSession): Promise<string> {
  const debateHistory = debateSession.rounds.map(r => `${r.agent}: ${r.argument}`).join('\n');
  
  const prompt = `Determine the winner of this debate:
Topic: ${debateSession.topic}
History:
${debateHistory}

Consider argument quality, evidence, logic, and persuasiveness. Respond with the agent name or "TIE".`;
  
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a debate judge determining winners.' },
      { role: 'user', content: prompt }
    ]
  });
  
  return result.choices[0].message.content || 'TIE';
} 