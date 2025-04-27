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