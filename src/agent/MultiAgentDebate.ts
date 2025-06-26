import { messageBus } from './MessageBus';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AgentParticipant {
  name: string;
  role: string;
  expertise: string[];
}

interface GroupDebateSession {
  sessionId: string;
  topic: string;
  participants: AgentParticipant[];
  discussion: DiscussionRound[];
  maxRounds: number;
  currentRound: number;
  status: 'active' | 'concluded';
  consensus?: string;
  dissentingOpinions?: string[];
}

interface DiscussionRound {
  agent: string;
  contribution: string;
  timestamp: Date;
  roundNumber: number;
}

const activeGroupDebates = new Map<string, GroupDebateSession>();

// Define agent participants with their roles and expertise
const AGENT_PARTICIPANTS: AgentParticipant[] = [
  {
    name: 'IntentAgent',
    role: 'Problem Analyzer',
    expertise: ['intent analysis', 'requirement gathering', 'problem framing']
  },
  {
    name: 'DataAgent',
    role: 'Data Specialist',
    expertise: ['data preparation', 'feature engineering', 'data quality']
  },
  {
    name: 'ModelBuilderAgent',
    role: 'Model Architect',
    expertise: ['model design', 'constraint formulation', 'optimization setup']
  },
  {
    name: 'SolverAgent',
    role: 'Optimization Expert',
    expertise: ['mathematical optimization', 'algorithm selection', 'solution validation']
  },
  {
    name: 'ExplainAgent',
    role: 'Interpretation Specialist',
    expertise: ['solution explanation', 'stakeholder communication', 'business impact']
  },
  {
    name: 'CritiqueAgent',
    role: 'Quality Assurance',
    expertise: ['output validation', 'risk assessment', 'alternative evaluation']
  }
];

// Listen for complex decisions that require multi-agent discussion
messageBus.subscribe('complex_decision_required', async (msg) => {
  const sessionId = `group_debate_${msg.correlationId}`;
  
  const groupDebate: GroupDebateSession = {
    sessionId,
    topic: msg.payload.topic,
    participants: AGENT_PARTICIPANTS,
    discussion: [],
    maxRounds: 5,
    currentRound: 0,
    status: 'active'
  };
  
  activeGroupDebates.set(sessionId, groupDebate);
  
  // Start the group discussion
  await initiateGroupDiscussion(groupDebate, msg.payload);
});

// Listen for individual agent contributions
messageBus.subscribe('agent_contribution', async (msg) => {
  const sessionId = msg.payload.sessionId;
  const groupDebate = activeGroupDebates.get(sessionId);
  
  if (!groupDebate || groupDebate.status !== 'active') return;
  
  // Add the contribution to the discussion
  groupDebate.discussion.push({
    agent: msg.payload.agent,
    contribution: msg.payload.contribution,
    timestamp: new Date(),
    roundNumber: groupDebate.currentRound
  });
  
  // Check if all agents have contributed to this round
  const expectedContributions = groupDebate.participants.length;
  const currentRoundContributions = groupDebate.discussion.filter(
    d => d.roundNumber === groupDebate.currentRound
  ).length;
  
  if (currentRoundContributions >= expectedContributions) {
    // Move to next round or conclude
    groupDebate.currentRound++;
    
    if (groupDebate.currentRound >= groupDebate.maxRounds) {
      await concludeGroupDebate(groupDebate);
    } else {
      await advanceToNextRound(groupDebate);
    }
  }
});

async function initiateGroupDiscussion(groupDebate: GroupDebateSession, payload: any) {
  const prompt = `You are coordinating a multi-agent discussion about: ${groupDebate.topic}

Available agents and their expertise:
${groupDebate.participants.map(p => `- ${p.name} (${p.role}): ${p.expertise.join(', ')}`).join('\n')}

Context: ${JSON.stringify(payload)}

Generate a structured discussion prompt that encourages each agent to contribute from their area of expertise.`;

  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a discussion coordinator for multi-agent debates.' },
      { role: 'user', content: prompt }
    ]
  });

  const discussionPrompt = result.choices[0].message.content || 'Please discuss this topic from your area of expertise.';

  // Publish discussion start event
  messageBus.publish({
    type: 'group_discussion_started',
    payload: {
      sessionId: groupDebate.sessionId,
      topic: groupDebate.topic,
      prompt: discussionPrompt,
      participants: groupDebate.participants
    },
    correlationId: payload.correlationId
  });

  // Invite each agent to contribute
  groupDebate.participants.forEach(participant => {
    messageBus.publish({
      type: 'invite_contribution',
      payload: {
        sessionId: groupDebate.sessionId,
        agent: participant.name,
        prompt: discussionPrompt,
        topic: groupDebate.topic,
        round: groupDebate.currentRound
      },
      correlationId: payload.correlationId
    });
  });
}

async function advanceToNextRound(groupDebate: GroupDebateSession) {
  const currentRoundDiscussion = groupDebate.discussion.filter(
    d => d.roundNumber === groupDebate.currentRound - 1
  );
  
  const discussionSummary = currentRoundDiscussion.map(d => 
    `${d.agent}: ${d.contribution}`
  ).join('\n');

  const prompt = `Based on the previous round of discussion:
${discussionSummary}

Generate a follow-up prompt that encourages deeper analysis, addresses disagreements, or explores new aspects of the topic.`;

  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a discussion coordinator advancing multi-agent debates.' },
      { role: 'user', content: prompt }
    ]
  });

  const nextRoundPrompt = result.choices[0].message.content || 'Please continue the discussion.';

  // Publish next round event
  messageBus.publish({
    type: 'group_discussion_continued',
    payload: {
      sessionId: groupDebate.sessionId,
      round: groupDebate.currentRound,
      prompt: nextRoundPrompt,
      previousRound: currentRoundDiscussion
    },
    correlationId: groupDebate.sessionId
  });

  // Invite agents for next round
  groupDebate.participants.forEach(participant => {
    messageBus.publish({
      type: 'invite_contribution',
      payload: {
        sessionId: groupDebate.sessionId,
        agent: participant.name,
        prompt: nextRoundPrompt,
        topic: groupDebate.topic,
        round: groupDebate.currentRound,
        previousRound: currentRoundDiscussion
      },
      correlationId: groupDebate.sessionId
    });
  });
}

async function concludeGroupDebate(groupDebate: GroupDebateSession) {
  const fullDiscussion = groupDebate.discussion.map(d => 
    `${d.agent}: ${d.contribution}`
  ).join('\n');

  const prompt = `Summarize this multi-agent discussion and identify key outcomes:

Topic: ${groupDebate.topic}
Full Discussion:
${fullDiscussion}

Provide:
1. A consensus summary
2. Any dissenting opinions
3. Key insights and recommendations
4. Areas of agreement and disagreement`;

  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a discussion summarizer for multi-agent debates.' },
      { role: 'user', content: prompt }
    ]
  });

  const summary = result.choices[0].message.content || 'No summary generated.';

  groupDebate.status = 'concluded';
  groupDebate.consensus = summary;

  // Publish conclusion event
  messageBus.publish({
    type: 'group_discussion_concluded',
    payload: {
      sessionId: groupDebate.sessionId,
      topic: groupDebate.topic,
      summary: summary,
      fullDiscussion: groupDebate.discussion,
      participants: groupDebate.participants
    },
    correlationId: groupDebate.sessionId
  });

  activeGroupDebates.delete(groupDebate.sessionId);
}

// Helper function to trigger complex decision discussions
export function triggerComplexDecision(topic: string, context: any, correlationId: string) {
  messageBus.publish({
    type: 'complex_decision_required',
    payload: {
      topic,
      context,
      complexity: 'high',
      requiresMultiAgentInput: true
    },
    correlationId
  });
} 