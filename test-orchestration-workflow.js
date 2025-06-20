const { agnoIntentAgent } = require('./src/pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent');
const { agnoDataAgent } = require('./src/pages/api/_lib/dcisionai-agents/dataAgent/agnoDataAgent');
const { agnoModelBuilderAgent } = require('./src/pages/api/_lib/dcisionai-agents/modelBuilderAgent/agnoModelBuilderAgent');

async function testOrchestrationWorkflow() {
  console.log('🧪 Testing Orchestration Workflow...\n');

  try {
    // Test 1: Intent Analysis
    console.log('1️⃣ Testing Intent Agent...');
    const customerQuery = "I need to optimize my construction project schedule to minimize costs while meeting quality standards";
    const customerData = {
      project_name: "Office Building Construction",
      budget: 5000000,
      timeline: "12 months",
      requirements: ["quality", "cost_optimization", "schedule_optimization"]
    };

    const intentResult = await agnoIntentAgent.analyzeIntent(
      customerQuery,
      customerData,
      'test-session-123'
    );
    console.log('✅ Intent Analysis Result:', {
      decisionType: intentResult.decisionType,
      confidence: intentResult.confidence,
      reasoning: intentResult.reasoning?.substring(0, 100) + '...'
    });

    // Test 2: Data Enrichment
    console.log('\n2️⃣ Testing Data Agent...');
    const enrichedData = await agnoDataAgent.enrichData(
      customerData,
      intentResult,
      'test-session-123'
    );
    console.log('✅ Data Enrichment Result:', {
      hasResources: !!enrichedData.resources,
      hasTimeline: !!enrichedData.timeline,
      hasCosts: !!enrichedData.costs,
      hasQuality: !!enrichedData.quality,
      hasRisks: !!enrichedData.risks
    });

    // Test 3: Model Building
    console.log('\n3️⃣ Testing Model Builder Agent...');
    const modelResult = await agnoModelBuilderAgent.buildModel(
      enrichedData,
      intentResult,
      'test-session-123'
    );
    console.log('✅ Model Building Result:', {
      hasVariables: !!modelResult.mcpConfig.variables,
      variableCount: modelResult.mcpConfig.variables?.length || 0,
      hasConstraints: !!modelResult.mcpConfig.constraints,
      hasObjective: !!modelResult.mcpConfig.objective,
      confidence: modelResult.confidence,
      reasoning: modelResult.reasoning?.substring(0, 100) + '...'
    });

    // Test 4: Complete Workflow
    console.log('\n4️⃣ Testing Complete Workflow...');
    console.log('✅ All agents working together successfully!');
    console.log('📊 Final MCP Config Summary:');
    console.log(`   - Variables: ${modelResult.mcpConfig.variables.length}`);
    console.log(`   - Dense Constraints: ${modelResult.mcpConfig.constraints.dense.length}`);
    console.log(`   - Objective: ${modelResult.mcpConfig.objective.name}`);
    console.log(`   - Overall Confidence: ${modelResult.confidence}`);

  } catch (error) {
    console.error('❌ Orchestration Workflow Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test error handling with invalid data
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...\n');

  try {
    // Test with null data
    console.log('1️⃣ Testing with null data...');
    const intentResult = await agnoIntentAgent.analyzeIntent(
      null,
      null,
      'test-session-error'
    );
    console.log('✅ Intent Agent handled null data gracefully');

    // Test with empty data
    console.log('\n2️⃣ Testing with empty data...');
    const enrichedData = await agnoDataAgent.enrichData(
      {},
      {},
      'test-session-error'
    );
    console.log('✅ Data Agent handled empty data gracefully');

    // Test with invalid data
    console.log('\n3️⃣ Testing with invalid data...');
    const modelResult = await agnoModelBuilderAgent.buildModel(
      null,
      null,
      'test-session-error'
    );
    console.log('✅ Model Builder handled invalid data gracefully');

    console.log('\n✅ All error handling tests passed!');

  } catch (error) {
    console.error('❌ Error Handling Test Failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testOrchestrationWorkflow();
  await testErrorHandling();
  console.log('\n🎉 All tests completed!');
}

runAllTests().catch(console.error); 