const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Finance agent system prompt
const FINANCE_SYSTEM_PROMPT = `You are a professional financial advisor AI assistant. Your role is to:
1. Provide clear, accurate financial advice
2. Explain complex financial concepts in simple terms
3. Help users make informed financial decisions
4. Consider risk tolerance and financial goals
5. Stay up-to-date with financial regulations and best practices

When responding:
- Be professional but conversational
- Provide specific, actionable advice
- Explain your reasoning
- Consider the user's context and needs
- Stay within ethical and legal boundaries
- Disclose any limitations or uncertainties`;

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: FINANCE_SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
    });

    res.json({ message: completion.content[0].text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Agno server running on port ${port}`);
}); 