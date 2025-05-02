# MCP Architecture Diagram

```mermaid
graph TD
    subgraph MCP[Model-Context-Protocol]
        Model[Model Layer]
        Context[Context Layer]
        Protocol[Protocol Layer]
    end

    subgraph Agents[Agent System]
        Intent[IntentInterpreterAgent]
        DataCollect[DataCollectorAgent]
        DataEnrich[DataEnricherAgent]
        ModelBuild[ModelBuilderAgent]
        ModelRun[ModelRunnerAgent]
        SolutionExp[SolutionExplainerAgent]
    end

    subgraph Cloud[Cloud Services]
        Solver[Solver Service<br>GCP Cloud Run]
        LLM[LLM Service]
    end

    %% MCP to Agents
    Model --> ModelBuild
    Context --> Intent
    Protocol --> Agents

    %% Agent Flow
    Intent --> DataCollect
    DataCollect --> DataEnrich
    DataEnrich --> ModelBuild
    ModelBuild --> ModelRun
    ModelRun --> SolutionExp

    %% Cloud Integration
    ModelRun --> Solver
    Intent --> LLM
    SolutionExp --> LLM

    %% Styling
    classDef mcp fill:#f9f,stroke:#333,stroke-width:2px
    classDef agent fill:#bbf,stroke:#333,stroke-width:2px
    classDef cloud fill:#bfb,stroke:#333,stroke-width:2px

    class Model,Context,Protocol mcp
    class Intent,DataCollect,DataEnrich,ModelBuild,ModelRun,SolutionExp agent
    class Solver,LLM cloud
```

## Architecture Flow

1. **MCP Layer**
   - Model: Defines optimization problem structure
   - Context: Provides runtime and domain context
   - Protocol: Specifies execution flow

2. **Agent System**
   - IntentInterpreterAgent: Understands problem requirements
   - DataCollectorAgent: Gathers required data
   - DataEnricherAgent: Enhances data
   - ModelBuilderAgent: Constructs optimization model
   - ModelRunnerAgent: Executes solver
   - SolutionExplainerAgent: Explains results

3. **Cloud Services**
   - Solver Service: GCP Cloud Run deployment
   - LLM Service: Natural language processing

## Integration Points

1. **MCP to Agents**
   - Model data flows to ModelBuilderAgent
   - Context informs IntentInterpreterAgent
   - Protocol guides agent execution

2. **Agent to Cloud**
   - ModelRunnerAgent calls Solver Service
   - Intent and Solution agents use LLM
   - Cloud services provide scalability

## Key Features

1. **Modular Design**
   - Independent agent components
   - Clear separation of concerns
   - Easy to extend and modify

2. **Cloud Native**
   - Scalable solver service
   - Managed infrastructure
   - Secure communication

3. **LLM Integration**
   - Natural language understanding
   - Solution explanation
   - Business context 