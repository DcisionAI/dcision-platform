# DcisionAI Platform Sprint TODO

## Completed ✅
- Landing page redesign with modern UI
  - Added feature cards with icons
  - Improved typography and spacing
  - Added "Get Started" section
  - Optimized layout for better viewing
- MCP Core Components
  - Implemented OrchestrationContext
  - Implemented StepExecutor with retry logic
  - Implemented ProtocolRunner
  - Added comprehensive unit tests
  - Created sample DataCollectionAgent

## In Progress 🚀
- [ ] MCPBuilder Implementation
  - [ ] Create fluent builder interface for MCP construction
  - [ ] Add validation during build process
  - [ ] Implement common patterns as preset templates
  - [ ] Add type-safe step configuration
  - [ ] Create builder unit tests

## Next Up 📋
- [ ] Templates Implementation
  - [ ] JobShop template
  - [ ] RCPSP template
  - [ ] FlowShop template
  - [ ] Testing and validation for each template

- [ ] Dashboard Enhancements
  - [ ] Add data visualization components
  - [ ] Implement real-time updates
  - [ ] Add filtering and sorting capabilities
  - [ ] Improve mobile responsiveness

- [ ] Documentation
  - [ ] API documentation
  - [ ] User guides for templates
  - [ ] Integration guides
  - [ ] Best practices documentation

## Backlog 📝
- [ ] Advanced Features
  - [ ] Multi-user collaboration
  - [ ] Custom template builder
  - [ ] Advanced analytics dashboard
  - [ ] Export/import functionality

## Notes
- Focus on maintaining consistent UI/UX across all new features
- Ensure all new components follow the established design system
- Prioritize user feedback implementation
- Keep performance optimization in mind

## Technical Debt
- [ ] Improve error handling in StepExecutor
- [ ] Add input validation in OrchestrationContext
- [ ] Consider implementing transaction-like behavior for steps
- [ ] Add logging system for debugging

🥇 1. MCP Orchestrator (runProtocol(mcp: MCP))
📂 Folder/Files:

src/mcp/orchestrator/
  ├── ProtocolRunner.ts
  ├── StepExecutor.ts
  └── OrchestrationContext.ts

🛠 What to Build:

    ProtocolRunner.ts

        class ProtocolRunner

        Method: runProtocol(mcp: MCP): Promise<OrchestrationResult>

        Loop through mcp.protocol.steps[]

        For each step: call StepExecutor.runStep(step, context)

    StepExecutor.ts

        Dynamically trigger correct agent based on step.action

        Handle retry policies.

    OrchestrationContext.ts

        Manage evolving session state, variables, partial outputs.

✅ No LLM used here — pure orchestration.


📋 DcisionAI: MCPBuilder Specification and Conversational UI Plan
🛠️ MCPBuilder Module Design
📂 Folder Structure

src/mcp/
├── builder/
│   └── MCPBuilder.ts

📜 MCPBuilder Overview

Purpose:

    Enable progressive, safe building of an MCP object from multiple inputs (chatbot, API, templates).

    Standardize validation, enrichment, and finalization of an MCP.

    Ensure all flows (conversational or structured API) produce valid MCPs.

🧩 MCPBuilder Class Design

// src/mcp/builder/MCPBuilder.ts

import { MCP, Variable, Constraint, Objective, ProtocolStep, Environment, Dataset } from '../types';

export class MCPBuilder {
  private mcp: Partial<MCP> = {};

  constructor() {}

  addVariables(vars: Variable[]): this {
    this.mcp.model ??= { variables: [], constraints: [], objective: [] };
    this.mcp.model.variables = vars;
    return this;
  }

  addConstraints(constraints: Constraint[]): this {
    this.mcp.model ??= { variables: [], constraints: [], objective: [] };
    this.mcp.model.constraints = constraints;
    return this;
  }

  addObjectives(objectives: Objective[] | Objective): this {
    this.mcp.model ??= { variables: [], constraints: [], objective: [] };
    this.mcp.model.objective = Array.isArray(objectives) ? objectives : [objectives];
    return this;
  }

  setContext(context: Partial<MCP['context']>): this {
    this.mcp.context = context;
    return this;
  }

  setProtocol(protocol: Partial<MCP['protocol']>): this {
    this.mcp.protocol = protocol;
    return this;
  }

  enrichDefaults(): this {
    const now = new Date().toISOString();
    this.mcp.created ??= now;
    this.mcp.lastModified ??= now;
    this.mcp.version ??= '1.0.0';
    this.mcp.status ??= 'draft';
    return this;
  }

  build(): MCP {
    this.enrichDefaults();

    if (!this.mcp.model || !this.mcp.context || !this.mcp.protocol) {
      throw new Error('Incomplete MCP: Missing model, context, or protocol sections');
    }

    return this.mcp as MCP;
  }
}

🧠 Where to Use MCPBuilder
Context	Usage
/api/conversation.ts	Build MCP progressively as user answers questions.
/api/submit-problem.ts	Validate and enrich incomplete MCPs before starting orchestration.
Template Plugins (e.g., FleetOptimizationTemplate)	Programmatically build MCPs cleanly without manual JSON crafting.
🏗 Example Usage

const builder = new MCPBuilder();
const mcp = builder
  .addVariables(variableList)
  .addConstraints(constraintList)
  .addObjectives(objectives)
  .setContext(contextObject)
  .setProtocol(protocolObject)
  .build();

🎨 Conversational UI Component for Building MCP
📂 UI Components Structure

src/web/components/
├── ChatBox.tsx
├── ChatBubble.tsx
├── MCPProgress.tsx   # 🚀 New - show MCP building progress

🖥️ ChatBox.tsx

    Input text field for customer.

    Show history of conversation.

    Allow send button (or Enter to send).

🖥️ ChatBubble.tsx

    Render user messages and assistant messages differently.

    Optional tags like "question", "answer", "system message" can style differently.

🖥️ MCPProgress.tsx (New)

Purpose:

    Visualize the MCP construction as conversation progresses.

    Help users feel their inputs are being "used" toward something.

✨ MCPProgress.tsx UI Example

export default function MCPProgress({ progress }: { progress: Partial<MCP> }) {
  return (
    <div className="rounded-lg bg-white shadow p-4 mt-4">
      <h3 className="text-lg font-semibold mb-2">Building your Optimization Model</h3>
      <ul className="text-sm">
        <li>✅ Variables: {progress.model?.variables?.length || 0}</li>
        <li>✅ Constraints: {progress.model?.constraints?.length || 0}</li>
        <li>✅ Objective: {progress.model?.objective ? 'Set' : 'Pending'}</li>
        <li>✅ Context: {progress.context ? 'Set' : 'Pending'}</li>
        <li>✅ Protocol: {progress.protocol ? 'Set' : 'Pending'}</li>
      </ul>
    </div>
  );
}

📸 UI Visual Layout During Conversation

[ Chat history window       ] [ MCPProgress box at right/top ]
[ User input field           ]
[ Send button                ]

✅ Chat + building visualization = intuitive onboarding for non-technical users.
📢 Summary: Why MCPBuilder and MCPProgress Are Critical
Aspect	Impact
MCPBuilder	Standardizes how MCPs are built across API, Chat, Templates.
MCPProgress UI	Gives users live visual feedback that they're creating a real optimization model.
Clean Code	Avoids scattered ad-hoc MCP object creation everywhere.
Scalability	Easier to evolve MCP structure without breaking all input flows.

🥈 2. Fleet Optimization Plugin (End-to-End)
📂 Folder/Files:

src/plugins/fleet/
  ├── FleetOptimizationTemplate.ts
  ├── FleetDataAgent.ts
  ├── FleetSolverAgent.ts
  ├── FleetExplainabilityAgent.ts

🛠 What to Build:

    FleetOptimizationTemplate.ts

        Define MCP model: vehicles, deliveries, constraints, objectives.

    FleetDataAgent.ts

        Fetch dummy delivery points and vehicles.

    FleetSolverAgent.ts

        Solve VRP problem using OR-Tools or dummy solver.

    FleetExplainabilityAgent.ts

        (Optional LLM) Summarize optimized route results in natural language.

✅ LLM use optional for explainability.
🥉 3. Example Sessions (with Prebuilt Solutions)
📂 Folder/Files:

src/mcp/example_sessions/
  ├── fleet_session.json
  ├── workforce_session.json
src/web/lib/
  ├── sampleSessions.ts

🛠 What to Build:

    Create JSON files representing realistic fleet/workforce problems.

    Build dummy solution objects.

    sampleSessions.ts to preload into frontend.

✅ No LLM needed.
🏗 4. API Endpoints Wiring
📂 Folder/Files:

src/server/api/
  ├── submit-problem.ts
  ├── session-status.ts
  ├── solve-problem.ts

🛠 What to Build:

    submit-problem.ts

        Accept MCP input, validate, start orchestration.

    session-status.ts

        Query session progress.

    solve-problem.ts

        Trigger solving step (optional for MVP).

✅ No LLM needed.
📈 5. Initial Unit Testing
📂 Folder/Files:

tests/
  ├── mcp/
      └── MCPValidator.test.ts
  ├── orchestrator/
      └── ProtocolRunner.test.ts

🛠 What to Build:

    Test MCP validation (missing fields should fail).

    Test ProtocolRunner execution (steps succeed/fail properly).

✅ No LLM needed.
🗨️ 6. Conversational Frontend Chat UI
📂 Folder/Files:

src/web/components/
  ├── ChatBox.tsx
  ├── ChatBubble.tsx
src/web/pages/
  ├── conversation.tsx

🛠 What to Build:

    ChatBox.tsx

        Input box + send button + render chat history.

    ChatBubble.tsx

        Differentiate user/assistant messages.

    conversation.tsx

        Page rendering the chat experience.

✅ No direct LLM here — conversation handled by backend.
🧠 7. Conversational Agent Backend (/api/conversation)
📂 Folder/Files:

src/server/api/
  ├── conversation.ts
src/mcp/conversation/
  ├── ConversationManager.ts
  ├── ConversationFSM.ts
  ├── LLMAssistant.ts

🛠 What to Build:

    conversation.ts

        Accept text input, call ConversationManager.

    ConversationManager.ts

        Manage session state.

        Route user through FSM stages: problem type → resources → constraints → objective.

    ConversationFSM.ts

        Define allowed conversational states and transitions.

    LLMAssistant.ts

        Embed OpenAI API.

        Tasks:

            Parse natural language (intent recognition).

            Extract MCP elements (variables, constraints).

            Suggest follow-up questions.

            Confirm final MCP.

✅ Main LLM usage here.
🔀 8. Multi-Modality UX (Choose Chat or API)
📂 Folder/Files:

src/web/pages/
  ├── index.tsx

🛠 What to Build:

    Update landing page to let user pick:

        Submit a structured MCP

        Start a conversation

    Route to /mcp or /conversation.

✅ No LLM needed here.
📊 Full Overview: Where LLMs Are Embedded
Component	File	LLM Used?	Purpose
MCP Orchestrator	ProtocolRunner.ts	❌	Orchestration only
Fleet Plugin	FleetExplainabilityAgent.ts (optional)	✅	Natural language route summaries
Conversational Backend	LLMAssistant.ts	✅	Parse conversation, build MCP step-by-step
Frontend Chat	ChatBox.tsx	❌	No LLM
API Endpoints	submit-problem.ts	❌	No LLM
🧠 Engineering Tips

    Use OpenAI text-embedding-ada-002 if you want query understanding later.

    Use OpenAI GPT-4 Turbo for conversational parsing.

    Keep orchestrator agent-agnostic (no LLM assumptions inside).

    Modularize LLMAssistant.ts cleanly to switch models easily later (Azure OpenAI, Claude, etc.).