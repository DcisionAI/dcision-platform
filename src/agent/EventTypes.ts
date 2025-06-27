// Event Types for Choreographed Multi-Agent System
export const EVENT_TYPES = {
  // User Input Events
  USER_QUERY_RECEIVED: 'user_query_received',
  USER_FEEDBACK_RECEIVED: 'user_feedback_received',
  INTENT_IDENTIFIED: 'intent_identified',
  
  // Knowledge Retrieval Events
  KNOWLEDGE_RETRIEVAL_REQUESTED: 'knowledge_retrieval_requested',
  KNOWLEDGE_RETRIEVED: 'knowledge_retrieved',
  KNOWLEDGE_RETRIEVAL_FAILED: 'knowledge_retrieval_failed',
  RAG_RESPONSE_READY: 'rag_response_ready',
  
  // Optimization Events
  OPTIMIZATION_REQUESTED: 'optimization_requested',
  DATA_PREPARATION_REQUESTED: 'data_preparation_requested',
  DATA_PREPARED: 'data_prepared',
  MODEL_BUILDING_REQUESTED: 'model_building_requested',
  MODEL_BUILT: 'model_built',
  SOLVER_EXECUTION_REQUESTED: 'solver_execution_requested',
  SOLUTION_FOUND: 'solution_found',
  OPTIMIZATION_ERROR: 'optimization_error',
  
  // Explanation Events
  EXPLANATION_REQUESTED: 'explanation_requested',
  EXPLANATION_READY: 'explanation_ready',
  EXPLANATION_ERROR: 'explanation_error',
  
  // Critique & Debate Events
  CRITIQUE_REQUESTED: 'critique_requested',
  CRITIQUE_READY: 'critique_ready',
  DEBATE_REQUESTED: 'debate_requested',
  DEBATE_READY: 'debate_ready',
  
  // Response Events
  RESPONSE_READY: 'response_ready',
  RESPONSE_ERROR: 'response_error',
  
  // Workflow Events
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
  WORKFLOW_TIMEOUT: 'workflow_timeout',
  
  // Progress Events
  PROGRESS_UPDATE: 'progress_update',
  AGENT_INTERACTION: 'agent_interaction',
  
  // Error Events
  AGENT_ERROR: 'agent_error',
  RETRY_REQUESTED: 'retry_requested',
  FALLBACK_TRIGGERED: 'fallback_triggered',
  
  // Intent Analysis Events
  INTENT_ANALYSIS_STARTED: 'intent_analysis_started',
  INTENT_ANALYSIS_FAILED: 'intent_analysis_failed',
  
  // Response Generation Events
  RESPONSE_GENERATION_STARTED: 'response_generation_started',
  RESPONSE_GENERATED: 'response_generated',
  RESPONSE_GENERATION_FAILED: 'response_generation_failed',
  
  // Agent Communication Events
  AGENT_MESSAGE: 'agent_message',
  AGENT_STATUS_UPDATE: 'agent_status_update'
} as const;

// Intent Types
export const INTENT_TYPES = {
  KNOWLEDGE_RETRIEVAL: 'knowledge_retrieval',
  OPTIMIZATION: 'optimization',
  HYBRID: 'hybrid',
  EXPLANATION: 'explanation',
  ANALYSIS: 'analysis'
} as const;

// Agent Types
export const AGENT_TYPES = {
  INTENT_AGENT: 'intent_agent',
  KNOWLEDGE_AGENT: 'knowledge_agent',
  DATA_AGENT: 'data_agent',
  MODEL_BUILDER_AGENT: 'model_builder_agent',
  SOLVER_AGENT: 'solver_agent',
  EXPLAIN_AGENT: 'explain_agent',
  CRITIQUE_AGENT: 'critique_agent',
  DEBATE_AGENT: 'debate_agent',
  RESPONSE_AGENT: 'response_agent',
  COORDINATOR_AGENT: 'coordinator_agent'
} as const;

// Agent Capabilities
export const AGENT_CAPABILITIES = {
  INTENT_ANALYSIS: 'intent_analysis',
  KNOWLEDGE_RETRIEVAL: 'knowledge_retrieval',
  DATA_ENRICHMENT: 'data_enrichment',
  DATA_VALIDATION: 'data_validation',
  CONSTRAINT_EXTRACTION: 'constraint_extraction',
  MODEL_BUILDING: 'model_building',
  CONSTRAINT_MODELING: 'constraint_modeling',
  OBJECTIVE_FORMULATION: 'objective_formulation',
  OPTIMIZATION_SOLVING: 'optimization_solving',
  SOLUTION_VALIDATION: 'solution_validation',
  RESULT_ANALYSIS: 'result_analysis',
  RESPONSE_GENERATION: 'response_generation',
  WORKFLOW_COORDINATION: 'workflow_coordination',
  ERROR_HANDLING: 'error_handling',
  PROGRESS_TRACKING: 'progress_tracking'
} as const;

// Event Interfaces
export interface BaseEvent {
  type: string;
  payload: any;
  correlationId: string;
  from?: string;
  to?: string;
  timestamp?: string;
  metadata?: {
    agent?: string;
    step?: string;
    status?: 'started' | 'completed' | 'error';
    duration?: number;
    retryCount?: number;
  };
}

export interface UserQueryEvent extends BaseEvent {
  type: typeof EVENT_TYPES.USER_QUERY_RECEIVED;
  payload: {
    query: string;
    sessionId: string;
    customerData?: any;
    useCase?: string;
  };
}

export interface IntentIdentifiedEvent extends BaseEvent {
  type: typeof EVENT_TYPES.INTENT_IDENTIFIED;
  payload: {
    primaryIntent: string;
    confidence: number;
    entities: string[];
    decisionType?: string;
    requiresOptimization: boolean;
    requiresKnowledgeRetrieval: boolean;
    originalQuery: string;
  };
}

export interface KnowledgeRetrievalEvent extends BaseEvent {
  type: typeof EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED | typeof EVENT_TYPES.RAG_RESPONSE_READY;
  payload: {
    query: string;
    context?: any;
    results?: any[];
    sources?: string[];
  };
}

export interface OptimizationEvent extends BaseEvent {
  type: typeof EVENT_TYPES.OPTIMIZATION_REQUESTED | typeof EVENT_TYPES.SOLUTION_FOUND;
  payload: {
    problemType: string;
    constraints: any;
    objective: string;
    solution?: any;
    metrics?: any;
  };
}

export interface DataPreparationEvent extends BaseEvent {
  type: typeof EVENT_TYPES.DATA_PREPARATION_REQUESTED | typeof EVENT_TYPES.DATA_PREPARED;
  payload: {
    customerData: any;
    enrichedData?: any;
    validationResults?: any;
  };
}

export interface ModelBuildingEvent extends BaseEvent {
  type: typeof EVENT_TYPES.MODEL_BUILDING_REQUESTED | typeof EVENT_TYPES.MODEL_BUILT;
  payload: {
    problemType: string;
    modelConfig: any;
    mcpConfig?: any;
    validationResults?: any;
  };
}

export interface ExplanationEvent extends BaseEvent {
  type: typeof EVENT_TYPES.EXPLANATION_REQUESTED | typeof EVENT_TYPES.EXPLANATION_READY;
  payload: {
    content: string;
    format: 'text' | 'html' | 'markdown';
    context?: any;
    visualizations?: any[];
  };
}

export interface ResponseEvent extends BaseEvent {
  type: typeof EVENT_TYPES.RESPONSE_READY;
  payload: {
    content: any;
    format: string;
    metadata: {
      executionPath: string;
      agentsInvolved: string[];
      duration: number;
      confidence: number;
    };
  };
}

export interface ProgressEvent extends BaseEvent {
  type: typeof EVENT_TYPES.PROGRESS_UPDATE;
  payload: {
    step: string;
    status: 'started' | 'completed' | 'error';
    message: string;
    data?: any;
    percentage?: number;
  };
}

export interface ErrorEvent extends BaseEvent {
  type: typeof EVENT_TYPES.AGENT_ERROR | typeof EVENT_TYPES.WORKFLOW_FAILED;
  payload: {
    error: {
      code: string;
      message: string;
      context?: any;
    };
    step: string;
    agent: string;
    recoverable: boolean;
  };
}

// Type guard functions
export function isUserQueryEvent(event: BaseEvent): event is UserQueryEvent {
  return event.type === EVENT_TYPES.USER_QUERY_RECEIVED;
}

export function isIntentIdentifiedEvent(event: BaseEvent): event is IntentIdentifiedEvent {
  return event.type === EVENT_TYPES.INTENT_IDENTIFIED;
}

export function isKnowledgeRetrievalEvent(event: BaseEvent): event is KnowledgeRetrievalEvent {
  return event.type === EVENT_TYPES.KNOWLEDGE_RETRIEVAL_REQUESTED || 
         event.type === EVENT_TYPES.RAG_RESPONSE_READY;
}

export function isOptimizationEvent(event: BaseEvent): event is OptimizationEvent {
  return event.type === EVENT_TYPES.OPTIMIZATION_REQUESTED || 
         event.type === EVENT_TYPES.SOLUTION_FOUND;
}

export function isResponseEvent(event: BaseEvent): event is ResponseEvent {
  return event.type === EVENT_TYPES.RESPONSE_READY;
}

export function isErrorEvent(event: BaseEvent): event is ErrorEvent {
  return event.type === EVENT_TYPES.AGENT_ERROR || 
         event.type === EVENT_TYPES.WORKFLOW_FAILED;
}

// Event Priority Levels
export const EVENT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

// Workflow Status
export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled'
} as const;

// Error Types
export const ERROR_TYPES = {
  INTENT_ANALYSIS_FAILED: 'intent_analysis_failed',
  KNOWLEDGE_RETRIEVAL_FAILED: 'knowledge_retrieval_failed',
  DATA_ENRICHMENT_FAILED: 'data_enrichment_failed',
  MODEL_BUILDING_FAILED: 'model_building_failed',
  SOLVING_FAILED: 'solving_failed',
  RESPONSE_GENERATION_FAILED: 'response_generation_failed',
  WORKFLOW_TIMEOUT: 'workflow_timeout',
  AGENT_COMMUNICATION_FAILED: 'agent_communication_failed'
} as const;

// Optimization Problem Types
export const OPTIMIZATION_TYPES = {
  CREW_ASSIGNMENT: 'crew_assignment',
  SCHEDULING: 'scheduling',
  RESOURCE_ALLOCATION: 'resource_allocation',
  COST_OPTIMIZATION: 'cost_optimization',
  EFFICIENCY_OPTIMIZATION: 'efficiency_optimization'
} as const;

// Model Types
export const MODEL_TYPES = {
  LINEAR_PROGRAMMING: 'LP',
  MIXED_INTEGER_PROGRAMMING: 'MIP',
  QUADRATIC_PROGRAMMING: 'QP',
  NONLINEAR_PROGRAMMING: 'NLP'
} as const;

// Solver Types
export const SOLVER_TYPES = {
  HIGHS: 'highs',
  CBC: 'cbc',
  GLPK: 'glpk',
  CPLEX: 'cplex',
  GUROBI: 'gurobi'
} as const; 