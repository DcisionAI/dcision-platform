import { NextApiRequest, NextApiResponse } from 'next';
import { embedChunks } from '@/lib/RAG/embedding';
import { queryVectors } from '@/utils/RAG/pinecone';
import { getLLMAnswer } from '@/lib/RAG/llm';
import { agnoIntentAgent } from '@/pages/api/_lib/dcisionai-agents/intentAgent/agnoIntentAgent';
import { agnoExplainAgent } from '@/pages/api/_lib/dcisionai-agents/explainAgent/agnoExplainAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ type: 'error', content: 'Method not allowed' });
  }

  try {
    const { message, customerData = {}, sessionId = 'test-simple' } = req.body;
    if (!message) {
      return res.status(400).json({ type: 'error', content: 'Message is required' });
    }

    console.log(`🚀 Starting simplified agentic workflow for session: ${sessionId}`);
    console.log(`📝 User message: ${message}`);

    const startTime = Date.now();

    // Step 1: Intent Analysis
    console.log('🔍 Step 1: Analyzing intent...');
    const intent = await agnoIntentAgent.analyzeIntent(message, sessionId);
    console.log('✅ Intent analysis complete:', intent.primaryIntent);

    // Step 2: RAG Query (if knowledge retrieval)
    if (intent.primaryIntent === 'knowledge_retrieval') {
      console.log('🔍 Step 2: Performing RAG query...');
      const query = intent.ragQuery || message;
      
      // Perform RAG
      const [embedding] = await embedChunks([query]);
      const results = await queryVectors('dcisionai-construction-kb', embedding, 5);
      
      const context = results
        .map((r, i) => `Source ${i + 1}: ${r.metadata?.text || ''}`)
        .join('\n---\n');
      
      const answer = await getLLMAnswer(query, context);
      
      console.log('✅ RAG query complete');

      // Step 3: Explanation
      console.log('🔍 Step 3: Generating explanation...');
      const ragSolution = {
        status: 'rag_complete',
        query,
        keywords: intent.keywords,
        response: answer,
        model: { modelType: 'rag' },
        intent
      };
      
      const explanation = await agnoExplainAgent.explainSolution(ragSolution, sessionId);
      console.log('✅ Explanation complete');

      // Format response
      const responseContent = {
        solution: {
          status: 'rag_complete',
          query,
          response: answer,
          results: results.map(r => ({
            score: r.score,
            metadata: r.metadata
          }))
        },
        explanation,
        intent,
        sessionId,
        workflowType: 'agentic_simple',
        timestamps: {
          start: new Date(startTime).toISOString(),
          end: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      };

      res.status(200).json({
        type: 'agentic',
        content: responseContent
      });
    } else {
      res.status(400).json({
        type: 'error',
        content: 'This simplified endpoint only handles knowledge retrieval requests'
      });
    }

  } catch (error: any) {
    console.error('❌ Simplified agentic chat API error:', error);
    res.status(500).json({
      type: 'error',
      content: 'Network or server error. Please try again in a moment.'
    });
  }
} 