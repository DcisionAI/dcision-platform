import { messageBus } from './MessageBus';

// Define the workflow sequence
const WORKFLOW_SEQUENCE = [
  'call_intent_agent',
  'call_data_agent', 
  'call_model_builder',
  'call_solver_agent',
  'call_explain_agent',
  'trigger_critique',
  'trigger_debate',
  'workflow_finished'
];

// Track workflow state with processed events
const workflowState = new Map<string, { 
  currentStep: number; 
  data: any; 
  processedEvents: Set<string>;
  isCompleted: boolean;
  startTime: number;
}>();

// Track active sessions to prevent duplicates
const activeSessions = new Set<string>();

messageBus.subscribe('start', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Prevent duplicate session processing
  if (activeSessions.has(correlationId)) {
    console.log(`🔄 Skipping duplicate start for session: ${correlationId}`);
    return;
  }
  
  activeSessions.add(correlationId);
  console.log(`🚀 Starting workflow for session: ${correlationId}`);
  
  // Initialize workflow state with processed events tracking
  workflowState.set(correlationId, {
    currentStep: 0,
    data: msg.payload,
    processedEvents: new Set(),
    isCompleted: false,
    startTime: Date.now()
  });
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'workflow_started',
      status: 'started',
      message: 'Agentic workflow initiated'
    },
    correlationId
  });
  
  // Start with intent agent
  messageBus.publish({ 
    type: 'call_intent_agent', 
    payload: msg.payload, 
    correlationId 
  });
});

// Handle each step in the workflow
messageBus.subscribe('intent_identified', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('intent_identified')) {
    console.log(`🔄 Skipping duplicate intent_identified for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Intent identified for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('intent_identified');
  state.data.intent = msg.payload;
  state.currentStep = 1;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'intent_analysis',
      status: 'completed',
      message: `Intent identified: ${msg.payload.decisionType}`
    },
    correlationId
  });

  // Branch based on intent
  if (msg.payload.primaryIntent === 'knowledge_retrieval') {
    // Only trigger RAG/model builder path
    messageBus.publish({
      type: 'call_model_builder',
      payload: { ...state.data, intent: msg.payload },
      correlationId
    });
    return;
  }

  // Default: optimization/hybrid path
  messageBus.publish({
    type: 'agent_interaction',
    payload: {
      from: 'CoordinatorAgent',
      to: 'DataAgent',
      type: 'workflow_handoff',
      content: 'Handing off to Data Agent for data preparation'
    },
    correlationId
  });

  messageBus.publish({
    type: 'call_data_agent',
    payload: { ...state.data, intent: msg.payload },
    correlationId
  });
});

messageBus.subscribe('data_prepared', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('data_prepared')) {
    console.log(`🔄 Skipping duplicate data_prepared for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Data prepared for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('data_prepared');
  state.data.enrichedData = msg.payload;
  state.currentStep = 2;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'data_preparation',
      status: 'completed',
      message: 'Data enriched and prepared for modeling'
    },
    correlationId
  });
  
  // Publish agent interaction
  messageBus.publish({
    type: 'agent_interaction',
    payload: {
      from: 'CoordinatorAgent',
      to: 'ModelBuilderAgent',
      type: 'workflow_handoff',
      content: 'Handing off to Model Builder for optimization model creation'
    },
    correlationId
  });
  
  // Call model builder
  messageBus.publish({ 
    type: 'call_model_builder', 
    payload: { ...state.data, enrichedData: msg.payload }, 
    correlationId 
  });
});

messageBus.subscribe('model_built', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('model_built')) {
    console.log(`🔄 Skipping duplicate model_built for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Model built for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('model_built');
  state.data.model = msg.payload;
  state.currentStep = 3;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'model_building',
      status: 'completed',
      message: 'Optimization model created and validated'
    },
    correlationId
  });
  
  // Publish agent interaction
  messageBus.publish({
    type: 'agent_interaction',
    payload: {
      from: 'CoordinatorAgent',
      to: 'SolverAgent',
      type: 'workflow_handoff',
      content: 'Handing off to Solver Agent for optimization execution'
    },
    correlationId
  });
  
  // Call solver agent
  messageBus.publish({ 
    type: 'call_solver_agent', 
    payload: { ...state.data, model: msg.payload }, 
    correlationId 
  });
});

messageBus.subscribe('solution_found', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('solution_found')) {
    console.log(`🔄 Skipping duplicate solution_found for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Solution found for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('solution_found');
  state.data.solution = msg.payload;
  state.currentStep = 4;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'optimization',
      status: 'completed',
      message: 'Optimization solution found'
    },
    correlationId
  });
  
  // Publish agent interaction
  messageBus.publish({
    type: 'agent_interaction',
    payload: {
      from: 'CoordinatorAgent',
      to: 'ExplainAgent',
      type: 'workflow_handoff',
      content: 'Handing off to Explain Agent for solution interpretation'
    },
    correlationId
  });
  
  // Call explain agent
  messageBus.publish({ 
    type: 'call_explain_agent', 
    payload: { ...state.data, solution: msg.payload }, 
    correlationId 
  });
});

messageBus.subscribe('explanation_ready', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('explanation_ready')) {
    console.log(`🔄 Skipping duplicate explanation_ready for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Explanation ready for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('explanation_ready');
  state.data.explanation = msg.payload;
  state.currentStep = 5;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'explanation',
      status: 'completed',
      message: 'Solution explanation generated'
    },
    correlationId
  });
  
  // Initiate critique if enabled
  if (state.data.runCritique) {
    // Publish agent interaction
    messageBus.publish({
      type: 'agent_interaction',
      payload: {
        from: 'CoordinatorAgent',
        to: 'CritiqueAgent',
        type: 'workflow_handoff',
        content: 'Initiating critique of the complete solution'
      },
      correlationId
    });
    // Trigger critique
    messageBus.publish({ 
      type: 'trigger_critique', 
      payload: state.data, 
      correlationId 
    });
  } else {
    // No critique/debate enabled, finish workflow
    console.log(`✅ Workflow complete for session: ${correlationId} (no critique/debate)`);
    state.isCompleted = true;
    
    // Publish progress event
    messageBus.publish({
      type: 'progress',
      payload: {
        step: 'workflow_complete',
        status: 'completed',
        message: 'Agentic workflow completed'
      },
      correlationId
    });
    
    // Finish workflow
    messageBus.publish({ 
      type: 'workflow_finished', 
      payload: state.data, 
      correlationId 
    });
    
    // Clean up state
    workflowState.delete(correlationId);
    activeSessions.delete(correlationId);
  }
});

// Handle critique completion
messageBus.subscribe('critique_complete', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('critique_complete')) {
    console.log(`🔄 Skipping duplicate critique_complete for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Critique complete for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('critique_complete');
  state.data.critique = msg.payload;
  state.currentStep = 6;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'critique',
      status: 'completed',
      message: 'Solution critique completed'
    },
    correlationId
  });
  
  // Initiate debate if enabled
  if (state.data.runDebate) {
    // Publish agent interaction
    messageBus.publish({
      type: 'agent_interaction',
      payload: {
        from: 'CoordinatorAgent',
        to: 'DebateAgent',
        type: 'workflow_handoff',
        content: 'Initiating multi-agent debate on solution approach'
      },
      correlationId
    });
    // Trigger debate
    messageBus.publish({ 
      type: 'trigger_debate', 
      payload: state.data, 
      correlationId 
    });
  }
});

// Handle debate completion
messageBus.subscribe('debate_complete', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('debate_complete')) {
    console.log(`🔄 Skipping duplicate debate_complete for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ Debate complete for session: ${correlationId}`);
  
  // Mark as processed and completed
  state.processedEvents.add('debate_complete');
  state.data.debate = msg.payload;
  state.currentStep = 7;
  state.isCompleted = true;
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'debate',
      status: 'completed',
      message: 'Multi-agent debate completed'
    },
    correlationId
  });
  
  // Finish workflow
  messageBus.publish({ 
    type: 'workflow_finished', 
    payload: state.data, 
    correlationId 
  });
  
  // Clean up state
  workflowState.delete(correlationId);
  activeSessions.delete(correlationId);
});

// Handle errors and timeouts
messageBus.subscribe('agent_error', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.error(`❌ Agent error for session: ${correlationId}:`, msg.payload);
  
  // Publish error event
  messageBus.publish({ 
    type: 'workflow_error', 
    payload: { error: msg.payload, step: workflowState.get(correlationId)?.currentStep }, 
    correlationId 
  });
  
  // Clean up state
  workflowState.delete(correlationId);
  activeSessions.delete(correlationId);
});

// Handle RAG response completion
messageBus.subscribe('rag_response_ready', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  // Check if already processed or completed
  const state = workflowState.get(correlationId);
  if (!state || state.isCompleted || state.processedEvents.has('rag_response_ready')) {
    console.log(`🔄 Skipping duplicate rag_response_ready for session: ${correlationId}`);
    return;
  }
  
  console.log(`✅ RAG response ready for session: ${correlationId}`);
  
  // Mark as processed
  state.processedEvents.add('rag_response_ready');
  state.data.ragResponse = msg.payload;
  state.currentStep = 3; // Skip optimization steps
  
  // Publish progress event
  messageBus.publish({
    type: 'progress',
    payload: {
      step: 'rag_response',
      status: 'completed',
      message: 'RAG response generated'
    },
    correlationId
  });
  
  // Publish agent interaction
  messageBus.publish({
    type: 'agent_interaction',
    payload: {
      from: 'CoordinatorAgent',
      to: 'ExplainAgent',
      type: 'workflow_handoff',
      content: 'Handing off to Explain Agent for RAG response interpretation'
    },
    correlationId
  });
  
  // Call explain agent with RAG response
  messageBus.publish({ 
    type: 'call_explain_agent', 
    payload: { ...state.data, ragResponse: msg.payload }, 
    correlationId 
  });
}); 