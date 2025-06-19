// Test script for refactored DcisionAI agents
// This script verifies that all agents work correctly with the real Agno backend

import { agnoDataAgent } from './dataAgent/agnoDataAgent';
import { agnoIntentAgent } from './intentAgent/agnoIntentAgent';
import { agnoModelBuilderAgent } from './modelBuilderAgent/agnoModelBuilderAgent';
import { agnoExplainAgent } from './explainAgent/agnoExplainAgent';
import { ConstructionWorkflowOrchestrator } from './constructionWorkflow';

// Test data
const testCustomerData = {
  project: {
    name: "Test Construction Project",
    location: "Test City, ST",
    budget: 1000000,
    timeline: "6 months"
  },
  resources: {
    workers: [
      { type: "carpenter", count: 5, hourly_rate: 40 },
      { type: "electrician", count: 3, hourly_rate: 50 }
    ],
    equipment: [
      { type: "crane", count: 1, daily_rate: 500 }
    ]
  }
};

const testUserIntent = "Optimize our construction schedule to minimize costs while meeting our 6-month deadline.";

async function testIndividualAgents() {
  console.log('🧪 Testing individual agents...\n');

  try {
    // Test Data Agent
    console.log('1. Testing Data Agent...');
    const enrichedData = await agnoDataAgent.enrichData(
      testCustomerData,
      'test_session_1',
      'anthropic'
    );
    console.log('✅ Data Agent: Success');
    console.log(`   - Enriched data with ${enrichedData.constraints.length} constraints\n`);

    // Test Intent Agent
    console.log('2. Testing Intent Agent...');
    const intent = await agnoIntentAgent.interpretIntent(
      testUserIntent,
      'test_session_1',
      'anthropic'
    );
    console.log('✅ Intent Agent: Success');
    console.log(`   - Decision type: ${intent.decisionType}`);
    console.log(`   - Confidence: ${intent.confidence}\n`);

    // Test Model Builder Agent
    console.log('3. Testing Model Builder Agent...');
    const modelResult = await agnoModelBuilderAgent.buildModel(
      enrichedData.enrichedData,
      intent,
      'test_session_1',
      'anthropic'
    );
    console.log('✅ Model Builder Agent: Success');
    console.log(`   - Variables: ${modelResult.mcpConfig.variables.length}`);
    console.log(`   - Constraints: ${modelResult.mcpConfig.constraints.length}\n`);

    // Test Explain Agent
    console.log('4. Testing Explain Agent...');
    const explanation = await agnoExplainAgent.explainSolution(
      {
        enrichedData: enrichedData.enrichedData,
        intent: intent,
        mcpConfig: modelResult.mcpConfig,
        status: 'model_ready_for_optimization'
      },
      'test_session_1',
      'anthropic'
    );
    console.log('✅ Explain Agent: Success');
    console.log(`   - Key decisions: ${explanation.explanation.keyDecisions.length}`);
    console.log(`   - Recommendations: ${explanation.explanation.recommendations.length}\n`);

    return {
      enrichedData,
      intent,
      mcpConfig: modelResult.mcpConfig,
      explanation: explanation.explanation
    };

  } catch (error) {
    console.error('❌ Error testing individual agents:', error);
    throw error;
  }
}

async function testWorkflowOrchestrator() {
  console.log('🧪 Testing Workflow Orchestrator...\n');

  try {
    const orchestrator = new ConstructionWorkflowOrchestrator({
      modelProvider: 'anthropic',
      sessionId: 'test_workflow_1',
      enableLogging: true
    });

    const result = await orchestrator.executeWorkflow(testCustomerData, testUserIntent);

    console.log('✅ Workflow Orchestrator: Success');
    console.log(`   - Session ID: ${result.sessionId}`);
    console.log(`   - Duration: ${result.metadata.duration}ms`);
    console.log(`   - Model Provider: ${result.metadata.modelProvider}`);
    console.log(`   - Decision Type: ${result.intent.decisionType}`);
    console.log(`   - Confidence: ${result.intent.confidence}\n`);

    return result;

  } catch (error) {
    console.error('❌ Error testing workflow orchestrator:', error);
    throw error;
  }
}

async function testStepByStepExecution() {
  console.log('🧪 Testing Step-by-Step Execution...\n');

  try {
    const orchestrator = new ConstructionWorkflowOrchestrator({
      modelProvider: 'anthropic',
      sessionId: 'test_step_by_step',
      enableLogging: true
    });

    // Step 1: Data enrichment
    console.log('Step 1: Data enrichment...');
    const enrichedData = await orchestrator.executeStep('data_enrichment', {
      customerData: testCustomerData
    }) as any;
    console.log('✅ Data enrichment completed');

    // Step 2: Intent interpretation
    console.log('Step 2: Intent interpretation...');
    const intent = await orchestrator.executeStep('intent_interpretation', {
      userIntent: testUserIntent
    }) as any;
    console.log('✅ Intent interpretation completed');

    // Step 3: Model building
    console.log('Step 3: Model building...');
    const modelResult = await orchestrator.executeStep('model_building', {
      enrichedData: enrichedData.enrichedData,
      intent: intent
    }) as any;
    console.log('✅ Model building completed');

    // Step 4: Explanation
    console.log('Step 4: Explanation...');
    const explanation = await orchestrator.executeStep('explanation', {
      solution: {
        enrichedData: enrichedData.enrichedData,
        intent: intent,
        mcpConfig: modelResult.mcpConfig,
        status: 'model_ready_for_optimization'
      }
    }) as any;
    console.log('✅ Explanation completed\n');

    // Cleanup
    await orchestrator.cleanup();
    console.log('✅ Cleanup completed\n');

    return {
      enrichedData,
      intent,
      mcpConfig: modelResult.mcpConfig,
      explanation: explanation.explanation
    };

  } catch (error) {
    console.error('❌ Error testing step-by-step execution:', error);
    throw error;
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...\n');

  try {
    // Test with invalid data
    console.log('1. Testing with invalid data...');
    try {
      await agnoDataAgent.enrichData(null, 'test_error_1', 'anthropic');
      console.log('❌ Should have thrown an error for null data');
    } catch (error) {
      console.log('✅ Correctly handled null data error');
    }

    // Test with invalid intent
    console.log('2. Testing with invalid intent...');
    try {
      await agnoIntentAgent.interpretIntent('', 'test_error_2', 'anthropic');
      console.log('❌ Should have thrown an error for empty intent');
    } catch (error) {
      console.log('✅ Correctly handled empty intent error');
    }

    console.log('\n✅ Error handling tests completed\n');

  } catch (error) {
    console.error('❌ Error in error handling tests:', error);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting DcisionAI Agents Test Suite\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Test individual agents
    await testIndividualAgents();
    console.log('='.repeat(60) + '\n');

    // Test workflow orchestrator
    await testWorkflowOrchestrator();
    console.log('='.repeat(60) + '\n');

    // Test step-by-step execution
    await testStepByStepExecution();
    console.log('='.repeat(60) + '\n');

    // Test error handling
    await testErrorHandling();
    console.log('='.repeat(60) + '\n');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ DcisionAI agents are working correctly with the real Agno backend\n');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export {
  testIndividualAgents,
  testWorkflowOrchestrator,
  testStepByStepExecution,
  testErrorHandling,
  runAllTests
}; 