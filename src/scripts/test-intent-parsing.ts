// Use require for compatibility with ts-node and TypeScript modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { agnoIntentAgent } = require('../pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent');

// Test cases for JSON parsing
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

async function testIntentParsing() {
  console.log('🧪 Testing Intent Agent JSON Parsing...\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Input: ${testCase.input.substring(0, 100)}...`);
    
    try {
      const result = agnoIntentAgent.testJsonParsing(testCase.input);
      
      if (result) {
        console.log('✅ Parsing successful');
        console.log('Result:', JSON.stringify(result, null, 2));
      } else {
        console.log('❌ Parsing failed (returned null)');
      }
    } catch (error) {
      console.log('❌ Parsing error:', (error as Error).message);
    }
    
    console.log('---\n');
  }

  // Test actual intent analysis with a simple input
  console.log('🧪 Testing Full Intent Analysis...\n');
  
  try {
    const result = await agnoIntentAgent.analyzeIntent(
      'Optimize crew assignments for next week with max 15 workers',
      'test-session-123'
    );
    
    console.log('✅ Intent analysis completed');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Confidence:', result.confidence);
    console.log('Reasoning:', result.reasoning);
    
  } catch (error) {
    console.log('❌ Intent analysis failed:', (error as Error).message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testIntentParsing().catch(console.error);
}

export { testIntentParsing }; 