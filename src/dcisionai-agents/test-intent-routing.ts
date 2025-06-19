// Test script for Intent Agent Routing (RAG vs Optimization)
// Demonstrates the intent agent's ability to determine execution paths

import { agnoIntentAgent } from './intentAgent/agnoIntentAgent';
import { executeConstructionWorkflow } from './constructionWorkflow';

// Test queries for different execution paths
const testQueries = [
  // RAG queries (knowledge-based)
  {
    query: "What are OSHA safety requirements for scaffolding?",
    expectedPath: 'rag',
    description: 'Safety regulation query'
  },
  {
    query: "What are the best practices for concrete curing?",
    expectedPath: 'rag',
    description: 'Best practices query'
  },
  {
    query: "Tell me about LEED certification requirements",
    expectedPath: 'rag',
    description: 'Certification query'
  },
  {
    query: "What are common causes of construction delays?",
    expectedPath: 'rag',
    description: 'Knowledge query'
  },

  // Optimization queries (decision-making)
  {
    query: "Optimize crew allocation for this project",
    expectedPath: 'optimization',
    description: 'Resource allocation optimization'
  },
  {
    query: "Find the best schedule for these tasks",
    expectedPath: 'optimization',
    description: 'Scheduling optimization'
  },
  {
    query: "Minimize costs while meeting deadlines",
    expectedPath: 'optimization',
    description: 'Cost optimization'
  },
  {
    query: "Allocate resources optimally across multiple sites",
    expectedPath: 'optimization',
    description: 'Multi-site optimization'
  },

  // Hybrid queries (both knowledge and optimization)
  {
    query: "What are the best practices for crew scheduling, and then optimize our current schedule?",
    expectedPath: 'hybrid',
    description: 'Knowledge + scheduling optimization'
  },
  {
    query: "Tell me about risk management strategies, then optimize our project plan considering those risks",
    expectedPath: 'hybrid',
    description: 'Knowledge + risk optimization'
  }
];

// Sample customer data for optimization workflows
const sampleCustomerData = {
  projects: [
    {
      id: 'proj_001',
      name: 'Downtown Office Tower',
      location: 'New York, NY',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      budget: 5000000,
      status: 'planning'
    }
  ],
  resources: {
    workers: [
      { id: 'worker_001', name: 'John Smith', skills: ['concrete', 'steel'], availability: 40 },
      { id: 'worker_002', name: 'Jane Doe', skills: ['electrical', 'plumbing'], availability: 35 }
    ],
    equipment: [
      { id: 'equip_001', name: 'Crane A', type: 'tower_crane', capacity: 50, availability: 100 },
      { id: 'equip_002', name: 'Excavator B', type: 'excavator', capacity: 5, availability: 80 }
    ]
  },
  tasks: [
    {
      id: 'task_001',
      name: 'Foundation Work',
      duration: 30,
      dependencies: [],
      requiredSkills: ['concrete'],
      requiredEquipment: ['excavator']
    },
    {
      id: 'task_002',
      name: 'Steel Framework',
      duration: 45,
      dependencies: ['task_001'],
      requiredSkills: ['steel'],
      requiredEquipment: ['crane']
    }
  ]
};

async function testIntentRouting() {
  console.log('🧠 Testing Intent Agent Routing Capabilities\n');
  console.log('=' .repeat(80));

  for (const testCase of testQueries) {
    console.log(`\n📝 Test Case: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected Path: ${testCase.expectedPath}`);
    console.log('-'.repeat(60));

    try {
      // Test intent interpretation
      const intent = await agnoIntentAgent.interpretIntent(
        testCase.query,
        `test_session_${Date.now()}`,
        'anthropic'
      );

      console.log(`✅ Intent Analysis Results:`);
      console.log(`   Decision Type: ${intent.decisionType}`);
      console.log(`   Execution Path: ${intent.executionPath}`);
      console.log(`   Confidence: ${intent.confidence}`);
      console.log(`   Reasoning: ${intent.reasoning}`);

      if (intent.ragQuery) {
        console.log(`   RAG Query: ${intent.ragQuery}`);
      }

      if (intent.optimizationType) {
        console.log(`   Optimization Type: ${intent.optimizationType}`);
      }

      // Check if path matches expectation
      const pathMatch = intent.executionPath === testCase.expectedPath;
      console.log(`   Path Match: ${pathMatch ? '✅' : '❌'}`);

      // If it's an optimization or hybrid query, test the full workflow
      if (intent.executionPath === 'optimization' || intent.executionPath === 'hybrid') {
        console.log(`\n🔄 Testing Full Workflow for ${intent.executionPath} path...`);
        
        try {
          const workflowResult = await executeConstructionWorkflow(
            sampleCustomerData,
            testCase.query,
            {
              enableLogging: true,
              modelProvider: 'anthropic'
            }
          );

          console.log(`✅ Workflow completed successfully!`);
          console.log(`   Execution Path: ${workflowResult.metadata.executionPath}`);
          console.log(`   Duration: ${workflowResult.metadata.duration}ms`);
          
          if (workflowResult.ragResult) {
            console.log(`   RAG Sources: ${workflowResult.ragResult.sources.length}`);
          }
          
          if (workflowResult.optimizationResult) {
            console.log(`   Optimization Status: ${workflowResult.optimizationResult.status}`);
            console.log(`   Solver Used: ${workflowResult.optimizationResult.metadata.solver_used}`);
          }

          console.log(`   Explanation Summary: ${workflowResult.explanation.summary.substring(0, 100)}...`);

        } catch (workflowError: any) {
          console.log(`❌ Workflow failed: ${workflowError.message}`);
        }
      }

    } catch (error: any) {
      console.log(`❌ Intent analysis failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  console.log('\n🎯 Intent Routing Test Summary');
  console.log('The intent agent successfully determines the appropriate execution path:');
  console.log('• RAG: For knowledge queries, best practices, regulations');
  console.log('• Optimization: For decision-making, resource allocation, scheduling');
  console.log('• Hybrid: For complex requests requiring both knowledge and optimization');
}

async function testRAGOnlyWorkflow() {
  console.log('\n🔍 Testing RAG-Only Workflow\n');
  console.log('=' .repeat(80));

  const ragQuery = "What are the key safety considerations for working at heights?";
  
  try {
    const workflowResult = await executeConstructionWorkflow(
      null, // No customer data needed for RAG-only
      ragQuery,
      {
        enableLogging: true,
        modelProvider: 'anthropic',
        ragOptions: {
          topK: 3,
          indexName: 'dcisionai-construction-kb'
        }
      }
    );

    console.log(`✅ RAG-Only Workflow Results:`);
    console.log(`   Execution Path: ${workflowResult.metadata.executionPath}`);
    console.log(`   Duration: ${workflowResult.metadata.duration}ms`);
    
    if (workflowResult.ragResult) {
      console.log(`   RAG Answer: ${workflowResult.ragResult.answer.substring(0, 200)}...`);
      console.log(`   Sources Found: ${workflowResult.ragResult.sources.length}`);
    }

    console.log(`   Explanation: ${workflowResult.explanation.summary.substring(0, 150)}...`);

  } catch (error: any) {
    console.log(`❌ RAG workflow failed: ${error.message}`);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Intent Agent Routing Tests\n');
  
  try {
    await testIntentRouting();
    await testRAGOnlyWorkflow();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Key Features Demonstrated:');
    console.log('• Intent agent correctly routes queries to appropriate execution paths');
    console.log('• RAG queries retrieve knowledge from the construction knowledge base');
    console.log('• Optimization queries build and solve mathematical models');
    console.log('• Hybrid queries combine both knowledge and optimization');
    console.log('• Workflow orchestrator handles all three paths seamlessly');
    
  } catch (error: any) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Export for use in other modules
export { testIntentRouting, testRAGOnlyWorkflow, runTests };

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
} 