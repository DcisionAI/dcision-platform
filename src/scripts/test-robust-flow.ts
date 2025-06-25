import { agnoIntentAgent } from '../pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent';
import { agnoDataAgent } from '../pages/api/_lib/dcisionai-agents/dataAgent/agnoDataAgent';
import { agnoExplainAgent } from '../pages/api/_lib/dcisionai-agents/explainAgent/agnoExplainAgent';
import { agnoModelBuilderAgent } from '../pages/api/_lib/dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent';
import { dynamicModelBuilder } from '../pages/api/_lib/dcisionai-agents/modelBuilderAgent/dynamicModelBuilder';
import { enhancedModelBuilder } from '../pages/api/_lib/dcisionai-agents/modelBuilderAgent/enhancedModelBuilder';

// Test cases for different response formats
const testCases = [
  // Case 1: Clean JSON
  {
    name: 'Clean JSON',
    input: '{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]}',
    expected: 'success'
  },
  // Case 2: JSON with markdown
  {
    name: 'JSON with markdown',
    input: '```json\n{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]}\n```',
    expected: 'success'
  },
  // Case 3: JSON with extra text
  {
    name: 'JSON with extra text',
    input: 'Here is the analysis: {"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]} Hope this helps!',
    expected: 'success'
  },
  // Case 4: JSON with control characters
  {
    name: 'JSON with control characters',
    input: '{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test\nwith\nnewlines", "keywords": ["test"]}',
    expected: 'success'
  },
  // Case 5: Malformed JSON (should fail gracefully)
  {
    name: 'Malformed JSON',
    input: '{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]',
    expected: 'fallback'
  }
];

async function testRobustFlow() {
  console.log('🧪 Testing Robust Flow - All Agents...\n');

  // Test 1: Intent Agent
  console.log('🔍 Testing Intent Agent...');
  try {
    const intentResult = await agnoIntentAgent.analyzeIntent(
      'Optimize crew assignments for next week with max 15 workers',
      'test-session-123'
    );
    
    console.log('✅ Intent analysis completed');
    console.log('Confidence:', intentResult.confidence);
    console.log('Reasoning:', intentResult.reasoning);
    console.log('Decision Type:', intentResult.decisionType);
    console.log('Primary Intent:', intentResult.primaryIntent);
    
  } catch (error) {
    console.log('❌ Intent analysis failed:', (error as Error).message);
  }
  console.log('---\n');

  // Test 2: Data Agent
  console.log('📊 Testing Data Agent...');
  try {
    const dataResult = await agnoDataAgent.enrichData(
      {},
      { decisionType: 'resource-allocation', primaryIntent: 'optimization' },
      'test-session-123',
      'anthropic',
      undefined,
      'Optimize crew assignments for next week with max 15 workers'
    );
    
    console.log('✅ Data enrichment completed');
    console.log('Confidence:', dataResult.metadata.confidence);
    console.log('Enriched Data Keys:', Object.keys(dataResult.enrichedData));
    console.log('Constraints:', dataResult.constraints.length);
    
  } catch (error) {
    console.log('❌ Data enrichment failed:', (error as Error).message);
  }
  console.log('---\n');

  // Test 3: Model Builder Agent
  console.log('🏗️ Testing Model Builder Agent...');
  try {
    const enrichedData = {
      enrichedData: {
        crews: [
          { type: 'carpenters', count: 5 },
          { type: 'electricians', count: 3 }
        ],
        constraints: [
          { type: 'max_workers', limit: 15 }
        ],
        objective: 'Minimize project duration'
      }
    };
    
    const intent = {
      decisionType: 'resource-allocation',
      primaryIntent: 'optimization',
      optimizationType: 'crew_assignment'
    };
    
    const modelResult = await agnoModelBuilderAgent.buildModel(
      enrichedData,
      intent,
      'test-session-123'
    );
    
    console.log('✅ Model building completed');
    console.log('Confidence:', modelResult.confidence);
    console.log('Reasoning:', modelResult.reasoning);
    console.log('Variables:', modelResult.mcpConfig.variables.length);
    console.log('Constraints:', modelResult.mcpConfig.constraints.dense.length);
    
  } catch (error) {
    console.log('❌ Model building failed:', (error as Error).message);
  }
  console.log('---\n');

  // Test 4: Explain Agent
  console.log('💡 Testing Explain Agent...');
  try {
    const solution = {
      status: 'optimization_completed',
      intent: {
        decisionType: 'resource-allocation',
        primaryIntent: 'optimization'
      },
      optimizationResult: {
        problem: {
          variables: [
            { name: 'carpenters', type: 'int', description: 'Number of carpenters' }
          ],
          constraints: {
            dense: [
              { name: 'max_workers', coefficients: [1], variables: ['carpenters'], operator: '<=', rhs: 15 }
            ]
          },
          objective: {
            name: 'minimize_cost',
            sense: 'minimize',
            coefficients: [1],
            variables: ['carpenters']
          }
        },
        solution: {
          objective_value: 10,
          status: 'optimal',
          solve_time_ms: 150
        }
      }
    };
    
    const explainResult = await agnoExplainAgent.explainSolution(
      solution,
      'test-session-123'
    );
    
    console.log('✅ Explanation completed');
    console.log('Summary:', explainResult.explanation.summary);
    console.log('Key Decisions:', explainResult.explanation.keyDecisions.length);
    console.log('Recommendations:', explainResult.explanation.recommendations.length);
    console.log('Insights:', explainResult.explanation.insights.length);
    
  } catch (error) {
    console.log('❌ Explanation failed:', (error as Error).message);
  }
  console.log('---\n');

  // Test 5: End-to-End Flow
  console.log('🔄 Testing End-to-End Flow...');
  try {
    // Step 1: Intent Analysis
    const intentResult = await agnoIntentAgent.analyzeIntent(
      'Optimize crew assignments for next week with max 15 workers',
      'test-e2e-session'
    );
    console.log('✅ Step 1: Intent Analysis - Confidence:', intentResult.confidence);

    // Step 2: Data Enrichment
    const dataResult = await agnoDataAgent.enrichData(
      {},
      intentResult,
      'test-e2e-session',
      'anthropic',
      undefined,
      'Optimize crew assignments for next week with max 15 workers'
    );
    console.log('✅ Step 2: Data Enrichment - Confidence:', dataResult.metadata.confidence);

    // Step 3: Model Building
    const modelResult = await agnoModelBuilderAgent.buildModel(
      dataResult,
      intentResult,
      'test-e2e-session'
    );
    console.log('✅ Step 3: Model Building - Confidence:', modelResult.confidence);

    // Step 4: Explanation
    const solution = {
      status: 'optimization_completed',
      intent: intentResult,
      optimizationResult: {
        problem: modelResult.mcpConfig,
        solution: {
          objective_value: 10,
          status: 'optimal',
          solve_time_ms: 150
        },
        enrichedData: dataResult.enrichedData
      }
    };
    
    const explainResult = await agnoExplainAgent.explainSolution(
      solution,
      'test-e2e-session'
    );
    console.log('✅ Step 4: Explanation - Generated successfully');

    console.log('🎉 End-to-End Flow Completed Successfully!');
    console.log('Final Confidence Scores:');
    console.log('- Intent:', intentResult.confidence);
    console.log('- Data:', dataResult.metadata.confidence);
    console.log('- Model:', modelResult.confidence);
    
  } catch (error) {
    console.log('❌ End-to-End Flow failed:', (error as Error).message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRobustFlow().catch(console.error);
}

export { testRobustFlow }; 