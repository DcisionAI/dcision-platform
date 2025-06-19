// Example usage of refactored DcisionAI agents with real Agno backend
// This file demonstrates how to use the agents individually and as part of the workflow

import { agnoDataAgent } from './dataAgent/agnoDataAgent';
import { agnoIntentAgent } from './intentAgent/agnoIntentAgent';
import { agnoModelBuilderAgent } from './modelBuilderAgent/agnoModelBuilderAgent';
import { agnoExplainAgent } from './explainAgent/agnoExplainAgent';
import { ConstructionWorkflowOrchestrator, executeConstructionWorkflow } from './constructionWorkflow';

// Example 1: Using agents individually
async function exampleIndividualAgents() {
  console.log('=== Example 1: Using agents individually ===');

  // Sample construction data
  const sampleData = {
    project: {
      name: "Downtown Office Complex",
      location: "New York, NY",
      budget: 50000000,
      timeline: "18 months"
    },
    resources: {
      workers: [
        { type: "carpenter", count: 15, hourly_rate: 45 },
        { type: "electrician", count: 8, hourly_rate: 55 },
        { type: "plumber", count: 6, hourly_rate: 50 }
      ],
      equipment: [
        { type: "crane", count: 2, daily_rate: 1200 },
        { type: "excavator", count: 1, daily_rate: 800 }
      ]
    },
    constraints: {
      max_workers_per_shift: 25,
      max_budget_overrun: 0.1,
      safety_requirements: ["OSHA compliance", "fall protection"]
    }
  };

  const userIntent = "Optimize our construction schedule to minimize costs while ensuring we meet our 18-month deadline and maintain safety standards.";

  try {
    // Step 1: Data Enrichment
    console.log('1. Enriching data...');
    const enrichedData = await agnoDataAgent.enrichData(
      sampleData,
      'example_session_1',
      'anthropic',
      'claude-3-sonnet-20240229'
    );
    console.log('✅ Data enriched with', enrichedData.constraints.length, 'constraints');

    // Step 2: Intent Interpretation
    console.log('2. Interpreting intent...');
    const intent = await agnoIntentAgent.interpretIntent(
      userIntent,
      'example_session_1',
      'anthropic',
      'claude-3-sonnet-20240229'
    );
    console.log('✅ Intent interpreted:', intent.decisionType, '(confidence:', intent.confidence, ')');

    // Step 3: Model Building
    console.log('3. Building optimization model...');
    const modelResult = await agnoModelBuilderAgent.buildModel(
      enrichedData.enrichedData,
      intent,
      'example_session_1',
      'anthropic',
      'claude-3-sonnet-20240229'
    );
    console.log('✅ Model built with', modelResult.mcpConfig.variables.length, 'variables and', modelResult.mcpConfig.constraints.length, 'constraints');

    // Step 4: Solution Explanation
    console.log('4. Generating explanation...');
    const explanation = await agnoExplainAgent.explainSolution(
      {
        enrichedData: enrichedData.enrichedData,
        intent: intent,
        mcpConfig: modelResult.mcpConfig,
        status: 'model_ready_for_optimization'
      },
      'example_session_1',
      'anthropic',
      'claude-3-sonnet-20240229'
    );
    console.log('✅ Explanation generated with', explanation.explanation.keyDecisions.length, 'key decisions');

    return {
      enrichedData,
      intent,
      mcpConfig: modelResult.mcpConfig,
      explanation: explanation.explanation
    };

  } catch (error) {
    console.error('❌ Error in individual agents example:', error);
    throw error;
  }
}

// Example 2: Using the workflow orchestrator
async function exampleWorkflowOrchestrator() {
  console.log('=== Example 2: Using workflow orchestrator ===');

  const sampleData = {
    project: {
      name: "Residential Complex",
      location: "Austin, TX",
      budget: 25000000,
      timeline: "12 months"
    },
    resources: {
      workers: [
        { type: "mason", count: 12, hourly_rate: 40 },
        { type: "roofer", count: 6, hourly_rate: 42 },
        { type: "painter", count: 8, hourly_rate: 35 }
      ],
      equipment: [
        { type: "scaffolding", count: 4, daily_rate: 150 },
        { type: "concrete_mixer", count: 2, daily_rate: 200 }
      ]
    }
  };

  const userIntent = "We need to optimize our workforce scheduling to maximize productivity while staying within budget. Consider weather conditions and material availability.";

  try {
    // Create orchestrator with options
    const orchestrator = new ConstructionWorkflowOrchestrator({
      modelProvider: 'anthropic',
      modelName: 'claude-3-sonnet-20240229',
      sessionId: 'example_workflow_1',
      enableLogging: true
    });

    // Execute complete workflow
    const result = await orchestrator.executeWorkflow(sampleData, userIntent);

    console.log('✅ Workflow completed successfully!');
    console.log('📊 Results:');
    console.log('- Session ID:', result.sessionId);
    console.log('- Duration:', result.metadata.duration, 'ms');
    console.log('- Model Provider:', result.metadata.modelProvider);
    console.log('- Execution Path:', result.metadata.executionPath);
    console.log('- Decision Type:', result.intent.decisionType);
    console.log('- Confidence:', result.intent.confidence);
    
    // Check if MCP config exists (only for optimization/hybrid paths)
    if (result.mcpConfig) {
      console.log('- Variables:', result.mcpConfig.variables.length);
      console.log('- Constraints:', result.mcpConfig.constraints.length);
    } else {
      console.log('- Variables: N/A (RAG-only query)');
      console.log('- Constraints: N/A (RAG-only query)');
    }
    
    // Check if optimization result exists
    if (result.optimizationResult) {
      console.log('- Optimization Status:', result.optimizationResult.status);
      console.log('- Solver Used:', result.optimizationResult.metadata.solver_used);
    } else {
      console.log('- Optimization Status: N/A (RAG-only query)');
      console.log('- Solver Used: N/A (RAG-only query)');
    }
    
    // Check if RAG result exists
    if (result.ragResult) {
      console.log('- RAG Sources:', result.ragResult.sources.length);
      console.log('- RAG Query:', result.ragResult.query);
    } else {
      console.log('- RAG Sources: N/A (Optimization-only query)');
      console.log('- RAG Query: N/A (Optimization-only query)');
    }
    
    console.log('- Key Decisions:', result.explanation.keyDecisions.length);
    console.log('- Recommendations:', result.explanation.recommendations.length);

    return result;

  } catch (error) {
    console.error('❌ Error in workflow orchestrator example:', error);
    throw error;
  }
}

// Example 3: Using the convenience function
async function exampleConvenienceFunction() {
  console.log('=== Example 3: Using convenience function ===');

  const sampleData = {
    project: {
      name: "Shopping Mall Renovation",
      location: "Miami, FL",
      budget: 15000000,
      timeline: "8 months"
    },
    resources: {
      workers: [
        { type: "tile_setter", count: 10, hourly_rate: 38 },
        { type: "electrician", count: 5, hourly_rate: 52 },
        { type: "hvac_technician", count: 4, hourly_rate: 48 }
      ]
    }
  };

  const userIntent = "Optimize our renovation schedule to minimize disruption to existing tenants while completing the project on time and under budget.";

  try {
    const result = await executeConstructionWorkflow(sampleData, userIntent, {
      modelProvider: 'openai',
      modelName: 'gpt-4-turbo-preview',
      enableLogging: true
    });

    console.log('✅ Convenience function completed successfully!');
    console.log('📈 Summary:', result.explanation.summary);
    console.log('🎯 Top recommendation:', result.explanation.recommendations[0]?.action);

    return result;

  } catch (error) {
    console.error('❌ Error in convenience function example:', error);
    throw error;
  }
}

// Example 4: Step-by-step execution
async function exampleStepByStep() {
  console.log('=== Example 4: Step-by-step execution ===');

  const orchestrator = new ConstructionWorkflowOrchestrator({
    modelProvider: 'anthropic',
    sessionId: 'example_step_by_step',
    enableLogging: true
  });

  const sampleData = {
    project: {
      name: "Bridge Construction",
      location: "Portland, OR",
      budget: 75000000,
      timeline: "24 months"
    }
  };

  const userIntent = "Optimize our bridge construction schedule considering seasonal weather patterns and river flow conditions.";

  try {
    // Execute each step individually
    console.log('Step 1: Data enrichment...');
    const enrichedData = await orchestrator.executeStep('data_enrichment', {
      customerData: sampleData
    }) as any;

    console.log('Step 2: Intent interpretation...');
    const intent = await orchestrator.executeStep('intent_interpretation', {
      userIntent: userIntent
    }) as any;

    console.log('Step 3: Model building...');
    const modelResult = await orchestrator.executeStep('model_building', {
      enrichedData: enrichedData.enrichedData,
      intent: intent
    }) as any;

    console.log('Step 4: Explanation...');
    const explanation = await orchestrator.executeStep('explanation', {
      solution: {
        enrichedData: enrichedData.enrichedData,
        intent: intent,
        mcpConfig: modelResult.mcpConfig,
        status: 'model_ready_for_optimization'
      }
    }) as any;

    console.log('✅ Step-by-step execution completed!');
    console.log('📋 Status:', orchestrator.getStatus());

    return {
      enrichedData,
      intent,
      mcpConfig: modelResult.mcpConfig,
      explanation: explanation.explanation
    };

  } catch (error) {
    console.error('❌ Error in step-by-step example:', error);
    throw error;
  } finally {
    // Clean up resources
    await orchestrator.cleanup();
  }
}

// Main function to run all examples
export async function runAllExamples() {
  console.log('🚀 Running all DcisionAI agent examples with real Agno backend\n');

  try {
    // Run examples sequentially
    await exampleIndividualAgents();
    console.log('\n' + '='.repeat(50) + '\n');

    await exampleWorkflowOrchestrator();
    console.log('\n' + '='.repeat(50) + '\n');

    await exampleConvenienceFunction();
    console.log('\n' + '='.repeat(50) + '\n');

    await exampleStepByStep();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('💥 Error running examples:', error);
    throw error;
  }
}

// Export individual functions for use in other files
export {
  exampleIndividualAgents,
  exampleWorkflowOrchestrator,
  exampleConvenienceFunction,
  exampleStepByStep
}; 