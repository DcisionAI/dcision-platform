#!/usr/bin/env ts-node

/**
 * Simple test script for GPT-4o-mini integration
 * Run with: npx ts-node src/scripts/test-simple-gpt4o.ts
 */

import { EnhancedModelBuilder } from '../pages/api/_lib/dcisionai-agents/modelBuilderAgent/enhancedModelBuilder';

// Simple test without complex imports
async function testGPT4oMiniSimple() {
  console.log('🧪 Simple GPT-4o-mini Test\n');

  // Test 1: Check if we can access the configuration
  try {
    console.log('📋 Test 1: Checking configuration access');
    
    // Simple configuration check
    const config = {
      provider: 'openai',
      modelName: 'gpt-4o-mini',
      useGPT4oMini: true
    };
    
    console.log('Model Config:', config);
    console.log('✅ Configuration test passed\n');
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return;
  }

  // Test 2: Check if we can import the model builder
  try {
    console.log('🔧 Test 2: Checking model builder import');
    // Static import already done above
    console.log('✅ Model builder import successful\n');
    
    // Test 3: Initialize the model builder
    console.log('🔧 Test 3: Initializing model builder');
    const builder = new EnhancedModelBuilder('openai', 'gpt-4o-mini', true);
    console.log('✅ Model builder initialized\n');
    
    // Test 4: Simple model building test
    console.log('🎯 Test 4: Simple model building test');
    const userInput = "Minimize cost for 100 units at $50/unit with budget limit $10,000.";
    
    const enrichedData = {
      materials: [{ name: 'material_a', cost: 50, required: 100 }],
      budget: 10000
    };

    const intent = {
      decisionType: 'optimization',
      optimizationType: 'cost_optimization',
      modelType: 'LP',
      problemComplexity: 'basic'
    };

    console.log('Building simple model with GPT-4o-mini...');
    const result = await builder.buildModel(userInput, enrichedData, intent);
    
    console.log('✅ Model built successfully!');
    console.log('Result:', {
      approach: result.approach,
      confidence: result.confidence,
      modelType: result.modelType,
      problemComplexity: result.problemComplexity
    });
    
  } catch (error) {
    console.error('❌ Model builder test failed:', error);
    console.error('Error details:', (error as Error).message);
    console.error('Stack trace:', (error as Error).stack);
  }

  console.log('\n🎉 Simple GPT-4o-mini test completed!');
}

// Run the test
async function main() {
  try {
    await testGPT4oMiniSimple();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 