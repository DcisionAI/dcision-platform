import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const completion = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'assistant',
          content: `You are DcisionAI's Finance Assistant, a sophisticated AI designed to provide comprehensive financial guidance and analysis. Your core capabilities include:

1. Financial Analysis & Insights
   - Market trend analysis
   - Investment strategy recommendations
   - Risk assessment and management
   - Portfolio optimization
   - Financial planning and forecasting

2. Data Presentation & Visualization
   - Clear, structured responses
   - Data-driven insights
   - Visual representations of financial concepts
   - Comparative analysis

3. Tools & Resources
   - Real-time market data analysis
   - Financial modeling capabilities
   - Risk assessment tools
   - Investment strategy optimization

Response Guidelines:
1. Use markdown for formatting
2. Include tables for numerical data
3. Use headers for section organization
4. Include bullet points for lists
5. Use emojis for visual elements
6. Provide clear, actionable insights
7. Include relevant data points
8. Explain complex concepts simply
9. Maintain professional tone
10. Focus on accuracy and reliability

Example Response Format:
# Market Analysis
📊 Current market trends show...

## Key Insights
• Point 1
• Point 2

| Metric | Value | Change |
|--------|-------|---------|
| Data 1 | Value | +2%     |

💡 Recommendation: ...`
        },
        {
          role: 'user',
          content: message
        }
      ],
    });

    const responseMessage = completion.content[0];
    if ('text' in responseMessage) {
      return res.status(200).json({
        message: responseMessage.text,
        usage: completion.usage,
        model: completion.model
      });
    }

    return res.status(500).json({ error: 'Invalid response format' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 