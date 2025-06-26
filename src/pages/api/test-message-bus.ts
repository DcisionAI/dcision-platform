import '@/agent/CoordinatorAgent';
import './_lib/dcisionai-agents/intentAgent/agnoIntentAgent';
import './_lib/dcisionai-agents/dataAgent/agnoDataAgent';
import './_lib/dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import './_lib/dcisionai-agents/explainAgent/agnoExplainAgent';
import './_lib/ConstructionMCPSolver';

import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '@/agent/MessageBus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testType = 'simple' } = req.body;
    
    if (testType === 'simple') {
      // Simple message bus test
      let receivedMessage = false;
      
      messageBus.subscribe('test_event', (msg) => {
        console.log('✅ Received test event:', msg);
        receivedMessage = true;
      });
      
      messageBus.publish({
        type: 'test_event',
        payload: { message: 'Hello from message bus!' },
        correlationId: 'test-123'
      });
      
      // Wait a bit for the message to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return res.status(200).json({
        success: true,
        messageBusWorking: receivedMessage,
        test: 'simple'
      });
    }
    
    if (testType === 'workflow') {
      // Test the workflow events
      const events: any[] = [];
      
      messageBus.subscribe('call_intent_agent', (msg) => {
        console.log('✅ Intent agent called:', msg);
        events.push({ type: 'call_intent_agent', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('intent_identified', (msg) => {
        console.log('✅ Intent identified:', msg);
        events.push({ type: 'intent_identified', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('call_data_agent', (msg) => {
        console.log('✅ Data agent called:', msg);
        events.push({ type: 'call_data_agent', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('data_prepared', (msg) => {
        console.log('✅ Data prepared:', msg);
        events.push({ type: 'data_prepared', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('call_model_builder', (msg) => {
        console.log('✅ Model builder called:', msg);
        events.push({ type: 'call_model_builder', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('model_built', (msg) => {
        console.log('✅ Model built:', msg);
        events.push({ type: 'model_built', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('call_solver_agent', (msg) => {
        console.log('✅ Solver agent called:', msg);
        events.push({ type: 'call_solver_agent', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('solution_found', (msg) => {
        console.log('✅ Solution found:', msg);
        events.push({ type: 'solution_found', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('call_explain_agent', (msg) => {
        console.log('✅ Explain agent called:', msg);
        events.push({ type: 'call_explain_agent', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('explanation_ready', (msg) => {
        console.log('✅ Explanation ready:', msg);
        events.push({ type: 'explanation_ready', timestamp: new Date().toISOString() });
      });
      
      messageBus.subscribe('workflow_finished', (msg) => {
        console.log('✅ Workflow finished:', msg);
        events.push({ type: 'workflow_finished', timestamp: new Date().toISOString() });
      });
      
      // Start the workflow
      console.log('🚀 Publishing start event...');
      messageBus.publish({
        type: 'start',
        payload: {
          query: 'Test optimization query',
          sessionId: 'test-workflow',
          customerData: {}
        },
        correlationId: 'test-workflow'
      });
      
      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return res.status(200).json({
        success: true,
        events,
        test: 'workflow',
        eventCount: events.length
      });
    }
    
    return res.status(400).json({ error: 'Invalid test type' });
    
  } catch (error: any) {
    console.error('Message bus test error:', error);
    return res.status(500).json({ error: error.message });
  }
} 