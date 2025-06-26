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

// Track workflow state
const workflowState = new Map<string, { currentStep: number; data: any }>();

// Add intent agent handler for testing
messageBus.subscribe('call_intent_agent', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`🧠 Intent Agent processing for session: ${correlationId}`);
  
  try {
    const query = msg.payload.query || msg.payload.message || 'Unknown query';
    
    // Simple intent analysis for testing
    const intent = {
      decisionType: 'optimization',
      optimizationType: 'linear_programming',
      domain: 'general',
      complexity: 'medium',
      query: query,
      timestamp: new Date().toISOString()
    };
    
    // Publish intent identified event
    messageBus.publish({
      type: 'intent_identified',
      payload: intent,
      correlationId
    });
    
    console.log(`✅ Intent identified for session: ${correlationId}:`, intent);
    
  } catch (error: any) {
    console.error(`❌ Intent Agent error for session: ${correlationId}:`, error);
    
    // Publish error event
    messageBus.publish({
      type: 'intent_error',
      payload: { error: error.message },
      correlationId
    });
  }
});

// Add data agent handler for testing
messageBus.subscribe('call_data_agent', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`📊 Data Agent processing for session: ${correlationId}`);
  
  try {
    // Simulate data preparation
    const enrichedData = {
      dataType: 'structured',
      records: 1000,
      features: ['feature1', 'feature2', 'feature3'],
      quality: 'high',
      timestamp: new Date().toISOString()
    };
    
    // Publish data prepared event
    messageBus.publish({
      type: 'data_prepared',
      payload: enrichedData,
      correlationId
    });
    
    console.log(`✅ Data prepared for session: ${correlationId}:`, enrichedData);
    
  } catch (error: any) {
    console.error(`❌ Data Agent error for session: ${correlationId}:`, error);
  }
});

// Add model builder handler for testing
messageBus.subscribe('call_model_builder', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`🏗️ Model Builder processing for session: ${correlationId}`);
  
  try {
    // Simulate model building
    const model = {
      type: 'linear_programming',
      variables: 10,
      constraints: 15,
      objective: 'minimize_cost',
      timestamp: new Date().toISOString()
    };
    
    // Publish model built event
    messageBus.publish({
      type: 'model_built',
      payload: model,
      correlationId
    });
    
    console.log(`✅ Model built for session: ${correlationId}:`, model);
    
  } catch (error: any) {
    console.error(`❌ Model Builder error for session: ${correlationId}:`, error);
  }
});

// Add solver agent handler for testing
messageBus.subscribe('call_solver_agent', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`⚡ Solver Agent processing for session: ${correlationId}`);
  
  try {
    // Simulate optimization solution
    const solution = {
      status: 'optimal',
      objectiveValue: 1500.0,
      variables: { x1: 10, x2: 5, x3: 8 },
      solveTime: 2.5,
      timestamp: new Date().toISOString()
    };
    
    // Publish solution found event
    messageBus.publish({
      type: 'solution_found',
      payload: solution,
      correlationId
    });
    
    console.log(`✅ Solution found for session: ${correlationId}:`, solution);
    
  } catch (error: any) {
    console.error(`❌ Solver Agent error for session: ${correlationId}:`, error);
  }
});

// Add explain agent handler for testing
messageBus.subscribe('call_explain_agent', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`📝 Explain Agent processing for session: ${correlationId}`);
  
  try {
    // Simulate explanation generation
    const explanation = {
      summary: 'The optimization solution minimizes costs while meeting all constraints.',
      keyInsights: ['Cost reduced by 25%', 'All constraints satisfied', 'Solution is optimal'],
      recommendations: ['Implement solution immediately', 'Monitor performance', 'Re-optimize monthly'],
      timestamp: new Date().toISOString()
    };
    
    // Publish explanation ready event
    messageBus.publish({
      type: 'explanation_ready',
      payload: explanation,
      correlationId
    });
    
    console.log(`✅ Explanation ready for session: ${correlationId}:`, explanation);
    
  } catch (error: any) {
    console.error(`❌ Explain Agent error for session: ${correlationId}:`, error);
  }
});

messageBus.subscribe('start', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`🚀 Starting workflow for session: ${correlationId}`);
  
  // Initialize workflow state
  workflowState.set(correlationId, {
    currentStep: 0,
    data: msg.payload
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
  
  console.log(`✅ Intent identified for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
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
    
    // Publish agent interaction
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
    
    // Call data agent
    messageBus.publish({ 
      type: 'call_data_agent', 
      payload: { ...state.data, intent: msg.payload }, 
      correlationId 
    });
  }
});

messageBus.subscribe('data_prepared', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`✅ Data prepared for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
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
  }
});

messageBus.subscribe('model_built', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`✅ Model built for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
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
  }
});

messageBus.subscribe('solution_found', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`✅ Solution found for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
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
  }
});

messageBus.subscribe('explanation_ready', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`✅ Explanation ready for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
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
  }
});

// Handle critique completion
messageBus.subscribe('critique_complete', async (msg) => {
  const correlationId = msg.correlationId;
  if (!correlationId) return;
  
  console.log(`✅ Critique complete for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
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
  
  console.log(`✅ Debate complete for session: ${correlationId}`);
  const state = workflowState.get(correlationId);
  if (state) {
    state.data.debate = msg.payload;
    state.currentStep = 7;
    
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
  }
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
}); 