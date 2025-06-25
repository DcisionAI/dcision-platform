import { agnoIntentAgent } from './agnoIntentAgent';

describe('agnoIntentAgent JSON Parsing', () => {
  const testCases = [
    {
      name: 'Clean JSON',
      input: '{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]}',
      expectSuccess: true
    },
    {
      name: 'JSON with markdown',
      input: '```json\n{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]}\n```',
      expectSuccess: true
    },
    {
      name: 'JSON with extra text',
      input: 'Here is the analysis: {"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]} Hope this helps!',
      expectSuccess: true
    },
    {
      name: 'JSON with control characters',
      input: '{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test\nwith\nnewlines", "keywords": ["test"]}',
      expectSuccess: true
    },
    {
      name: 'Malformed JSON',
      input: '{"decisionType": "resource-allocation", "primaryIntent": "optimization", "confidence": 0.9, "reasoning": "test", "keywords": ["test"]',
      expectSuccess: true
    }
  ];

  testCases.forEach(({ name, input, expectSuccess }) => {
    it(`should ${expectSuccess ? 'successfully parse' : 'fail to parse'}: ${name}`, () => {
      const result = agnoIntentAgent.testJsonParsing(input);
      if (expectSuccess) {
        expect(result).toBeTruthy();
        expect(result.decisionType).toBe('resource-allocation');
        expect(result.primaryIntent).toBe('optimization');
      } else {
        expect(result).toBeNull();
      }
    });
  });
}); 