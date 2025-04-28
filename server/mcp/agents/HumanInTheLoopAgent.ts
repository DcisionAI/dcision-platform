import { MCPAgent, AgentRunContext, AgentRunResult } from './AgentRegistry';
import { StepAction, ProtocolStep, MCP } from '../types';

interface ReviewRequest {
  id: string;
  type: 'review' | 'approval';
  description: string;
  data: any;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  timestamp: string;
}

export class HumanInTheLoopAgent implements MCPAgent {
  name = 'Human-in-the-Loop Agent';
  supportedActions: StepAction[] = ['human_review'];

  async run(step: ProtocolStep, mcp: MCP, context?: AgentRunContext): Promise<AgentRunResult> {
    const thoughtProcess: string[] = [];
    thoughtProcess.push(`Initiating human ${step.action} process...`);

    // Create review request
    const reviewRequest = this.createReviewRequest(step, mcp);
    thoughtProcess.push(`Created ${reviewRequest.type} request: ${reviewRequest.id}`);

    // In a real implementation, this would:
    // 1. Save the review request to a database
    // 2. Notify relevant stakeholders
    // 3. Wait for response or timeout
    // For now, we'll mock the process
    
    const mockReviewResponse = await this.mockReviewProcess(reviewRequest);
    thoughtProcess.push(`Received ${mockReviewResponse.status} response`);

    // LLM-assisted review summarization
    if (context?.llm) {
      const summaryPrompt = `
Summarize the following data for human review: ${JSON.stringify(reviewRequest.data)}
Suggest likely approval/rejection reasons.
Respond in JSON: { "summary": "...", "likelyActions": ["..."] }
`;
      try {
        const summaryRaw = await context.llm(summaryPrompt);
        const summary = JSON.parse(summaryRaw);
        if (summary.summary) {
          thoughtProcess.push(`LLM review summary: ${summary.summary}`);
        }
        if (summary.likelyActions?.length) {
          thoughtProcess.push(`LLM likely actions: ${summary.likelyActions.join(', ')}`);
        }

        // LLM-based critique and improvement suggestions
        const critiquePrompt = `
Given the following review summary: ${JSON.stringify(summary)}
Critique this summary for clarity, completeness, and usefulness for human reviewers. Suggest any improvements or additional considerations. Respond in JSON: { "critique": "...", "improvements": ["..."], "additionalConsiderations": ["..."] }
`;
        try {
          const critiqueRaw = await context.llm(critiquePrompt);
          const critique = JSON.parse(critiqueRaw);
          if (critique.critique) {
            thoughtProcess.push(`LLM critique: ${critique.critique}`);
          }
          if (critique.improvements?.length) {
            thoughtProcess.push(`LLM suggested improvements: ${critique.improvements.join(', ')}`);
          }
          if (critique.additionalConsiderations?.length) {
            thoughtProcess.push(`LLM additional considerations: ${critique.additionalConsiderations.join(', ')}`);
          }
        } catch (e) {
          thoughtProcess.push('LLM review summary critique response could not be parsed.');
        }
      } catch (e) {
        thoughtProcess.push('LLM review summary response could not be parsed.');
      }
    }

    if (mockReviewResponse.status === 'rejected') {
      return {
        output: {
          success: false,
          error: 'Review rejected',
          details: mockReviewResponse.feedback,
          reviewId: reviewRequest.id
        },
        thoughtProcess: thoughtProcess.join('\n'),
        feedbackUrl: `/reviews/${reviewRequest.id}`
      };
    }

    return {
      output: {
        success: true,
        reviewId: reviewRequest.id,
        status: mockReviewResponse.status,
        feedback: mockReviewResponse.feedback
      },
      thoughtProcess: thoughtProcess.join('\n'),
      feedbackUrl: `/reviews/${reviewRequest.id}`
    };
  }

  private createReviewRequest(step: ProtocolStep, mcp: MCP): ReviewRequest {
    return {
      id: `review-${Date.now()}`,
      type: step.action === 'human_review' ? 'review' : 'approval',
      description: step.description,
      data: {
        problemType: mcp.context.problemType,
        industry: mcp.context.industry,
        // Include relevant data for review based on step
        ...(step.parameters || {})
      },
      status: 'pending',
      timestamp: new Date().toISOString()
    };
  }

  private async mockReviewProcess(request: ReviewRequest): Promise<ReviewRequest> {
    // Mock implementation - in reality, this would wait for actual human input
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    return {
      ...request,
      status: 'approved',
      feedback: 'Solution looks good, approved for implementation.',
      timestamp: new Date().toISOString()
    };
  }

  // Helper method to format data for human review
  private formatForReview(data: any): string {
    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
        .join('\n');
    }
    return String(data);
  }
} 