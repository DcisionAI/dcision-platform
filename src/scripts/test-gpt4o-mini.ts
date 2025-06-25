#!/usr/bin/env ts-node

/**
 * Test script for GPT-4o-mini integration with Enhanced Model Builder
 * Run with: npx ts-node src/scripts/test-gpt4o-mini.ts
 */

import { EnhancedModelBuilder } from '../pages/api/_lib/dcisionai-agents/modelBuilderAgent/enhancedModelBuilder';
import { getModelConfig, modelPerformance } from '../pages/api/_lib/config/modelConfig';

async function testGPT4oMini() {
  console.log('🧪 Testing GPT-4o-mini Integration with Enhanced Model Builder\n');

  // Test 1: Configuration
  console.log('📋 Test 1: Model Configuration');
  const config = getModelConfig('modelBuilderAgent');
  console.log('Model Config:', {
    provider: config.provider,
    modelName: config.modelName,
    useGPT4oMini: config.useGPT4oMini
  });
  console.log('Performance:', modelPerformance[config.modelName as keyof typeof modelPerformance]);
  console.log('✅ Configuration test passed\n');

  // Test 2: Enhanced Model Builder Initialization
  console.log('🔧 Test 2: Enhanced Model Builder Initialization');
  const builder = new EnhancedModelBuilder('openai', 'gpt-4o-mini', true);
  console.log('✅ Enhanced Model Builder initialized\n');

  // Test 3: Simple Optimization Problem
  console.log('🎯 Test 3: Simple Optimization Problem');
  const userInput = "Minimize total cost for a project requiring 100 units of material A at $50/unit and 200 units of material B at $75/unit. Budget limit is $20,000.";
  
  const enrichedData = {
    materials: [
      { name: 'material_a', cost: 50, required: 100 },
      { name: 'material_b', cost: 75, required: 200 }
    ],
    budget: 20000
  };

  const intent = {
    decisionType: 'optimization',
    optimizationType: 'cost_optimization',
    modelType: 'LP',
    problemComplexity: 'basic'
  };

  try {
    console.log('Building model with GPT-4o-mini...');
    const result = await builder.buildModel(userInput, enrichedData, intent);
    
    console.log('✅ Model built successfully!');
    console.log('Result:', {
      approach: result.approach,
      confidence: result.confidence,
      modelType: result.modelType,
      problemComplexity: result.problemComplexity,
      variables: result.mcpConfig.variables.length,
      constraints: result.mcpConfig.constraints.dense.length
    });
    
    console.log('\n📊 Model Details:');
    console.log('Variables:', result.mcpConfig.variables.map((v: any) => `${v.name} (${v.type})`));
    console.log('Objective:', result.mcpConfig.objective);
    console.log('Constraints:', result.mcpConfig.constraints.dense.length);
    
  } catch (error) {
    console.error('❌ Model building failed:', error);
  }

  // Test 4: Complex Optimization Problem
  console.log('\n🎯 Test 4: Complex Optimization Problem');
  const complexInput = "Create a portfolio optimization model for 3 stocks with expected returns [0.08, 0.12, 0.06] and risk tolerance of 0.15. Maximize expected return while keeping risk below tolerance.";
  
  const complexEnrichedData = {
    stocks: [
      { name: 'stock_1', return: 0.08, risk: 0.04 },
      { name: 'stock_2', return: 0.12, risk: 0.09 },
      { name: 'stock_3', return: 0.06, risk: 0.02 }
    ],
    riskTolerance: 0.15
  };

  const complexIntent = {
    decisionType: 'optimization',
    optimizationType: 'portfolio_optimization',
    modelType: 'QP',
    problemComplexity: 'intermediate'
  };

  try {
    console.log('Building complex model with GPT-4o-mini...');
    const complexResult = await builder.buildModel(complexInput, complexEnrichedData, complexIntent);
    
    console.log('✅ Complex model built successfully!');
    console.log('Result:', {
      approach: complexResult.approach,
      confidence: complexResult.confidence,
      modelType: complexResult.modelType,
      problemComplexity: complexResult.problemComplexity
    });
    
  } catch (error) {
    console.error('❌ Complex model building failed:', error);
  }

  console.log('\n🎉 GPT-4o-mini integration test completed!');
}

// Performance comparison test
async function performanceComparison() {
  console.log('\n⚡ Performance Comparison Test\n');

  const testInput = "Optimize crew allocation: 5 carpenters ($25/hr), 3 electricians ($30/hr), 2 plumbers ($28/hr). Total crew ≤ 15. Minimize cost.";
  
  const testData = {
    crews: [
      { type: 'carpenters', rate: 25, min: 5 },
      { type: 'electricians', rate: 30, min: 3 },
      { type: 'plumbers', rate: 28, min: 2 }
    ],
    totalLimit: 15
  };

  const testIntent = {
    decisionType: 'optimization',
    optimizationType: 'crew_assignment',
    modelType: 'MIP',
    problemComplexity: 'basic'
  };

  // Test with different models
  const models = [
    { name: 'GPT-4o-mini', provider: 'openai' as const, model: 'gpt-4o-mini' },
    { name: 'GPT-4o', provider: 'openai' as const, model: 'gpt-4o' },
    { name: 'Claude-3.5', provider: 'anthropic' as const, model: 'claude-3-5-sonnet-20241022' }
  ];

  for (const model of models) {
    console.log(`Testing ${model.name}...`);
    const startTime = Date.now();
    
    try {
      const testBuilder = new EnhancedModelBuilder(model.provider, model.model);
      const result = await testBuilder.buildModel(testInput, testData, testIntent);
      const endTime = Date.now();
      
      console.log(`✅ ${model.name}: ${endTime - startTime}ms, Confidence: ${result.confidence}`);
    } catch (error) {
      console.log(`❌ ${model.name}: Failed`);
    }
  }
}

// Run tests
async function main() {
  try {
    await testGPT4oMini();
    await performanceComparison();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 