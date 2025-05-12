---
title: "Model Builder Next Steps / TODO"
---

# Model Builder TODOs

## Step 1: Intent Input
- [ ] Remove or properly use the unused `onNext` prop in Step1Intent:
  - Either remove the prop or auto-advance to Step 2 after a successful LLM interpretation.

## Step 2: Data Prep
- [ ] Complete the “Enrich” tab with actual enrichment plugin integrations.
- [ ] Complete the “Validate” tab to run mapping validations and display results.

### Context: Plugin-Based Agentic Data Flow
> DcisionAI integrates via declarative connectors (e.g. Postgres, Snowflake, BigQuery, Salesforce). Data is fetched on-demand (metadata & samples), streamed into memory (never stored raw), and passed through agents:
> - DataMappingAgent inspects schema & samples to infer required fields and problem type.
> - External enrichment plugins (e.g. TrafficEnrichmentPlugin) fetch auxiliary data, cached briefly.
> - Metadata (mapping decisions, configs, summaries) is persisted in Supabase.

### Implementation Plan
1. Data Source Plugin Integration
   - [ ] Ensure `PluginRegistry` supports all connectors: register Postgres, BigQuery, Supabase, etc.
   - [ ] In Step2DataPrep, populate connector list via `/api/connectors` and support selection UI.
   - [ ] On selection change, update `mcpConfig.context.dataset.metadata.connectors`.
2. Schema & Sample Fetch
   - [ ] Invoke `/api/connectors/schema?id={connectorId}` to retrieve table/column metadata.
   - [ ] For each selected connector, fetch sample rows via `/api/connectors/test` or a new sample-data endpoint.
   - [ ] Aggregate schema & samples in the `DataIntegrationAgent` context.
3. DataMappingAgent Invocation
   - [ ] In the “Mapping” tab, after obtaining schema & samples, POST to `/api/mcp/map` with:
     - `sessionId`, `intentDetails`, `requiredFields`, `databaseFields`, `tablesToScan`, `modelDefinition`.
   - [ ] Receive `fieldRequirements` and `mappings` from the agent; display must-have & nice-to-have fields.
4. External Data Augmentation (Enrich Tab)
   - [ ] Define enrichment plugin interfaces under `server/mcp/plugins/enrichment`.
   - [ ] Implement Terraform or simple Node.js wrappers for Traffic and Weather APIs.
   - [ ] Add caching layer (Redis or DuckDB): define TTL, key schema, cache lookup in enrichment plugins.
   - [ ] In the “Enrich” tab, allow users to select enrichment sources and trigger `DataIntegrationAgent` enrich step.
5. Mapping Validation (Validate Tab)
   - [ ] Extend `DataIntegrationAgent.validateMappings` to return warnings & errors.
   - [ ] Build UI in “Validate” tab: list unmapped fields, invalid transformations, allow manual overrides.
6. Persistence & Auditing
   - [ ] Persist `fieldRequirements`, `mappings`, and `heuristicAnalysis` in a `data_mappings` table in Supabase.
   - [ ] Include `sessionId`, `connectorId`, timestamps, and summary scores for auditing.
7. Error Handling & UX
   - [ ] Show loading spinners and error banners on fetch failures.
   - [ ] Allow retry on connector test, schema fetch, and mapping endpoints.
   - [ ] Document environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `LLM_PROVIDER`, API keys, etc.

## Step 3: Model & Constraints
- [ ] Render the actual `mcpConfig.model` data:
  - Variables table with edit capability.
  - Constraints table with edit capability.
  - Objective editing form.

## Step 4: Preview MCP
- [ ] (Optional) Add schema validation or linting for the generated JSON.

## Step 5: Solve & Explain
- [ ] Wire up the “Solve” button to the real MCP orchestration endpoint (`/api/mcp/submit`):
  - Stream real-time status updates.
  - Render actual `SolutionExplainerAgent` output from the API response.

## Step 6: Deploy
- [ ] Replace the mock deployment logic in Step6Deploy with a real deployment API:
  - Call backend endpoint to deploy the MCP model.
  - Persist deployed endpoint metadata in Supabase.
  - Display real endpoint URLs, status, and metrics.

## Miscellaneous Cleanup
- [ ] Remove or archive the old Playground workflow and code.
- [ ] Update documentation to reflect the new Model Builder flow.
- [ ] Remove any unused or placeholder code across the repo.