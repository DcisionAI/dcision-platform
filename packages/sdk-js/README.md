# @dcisionai/sdk-js

JavaScript/TypeScript SDK for DcisionAI Decision Workflows (MCP API).

## Installation
```bash
npm install @dcisionai/sdk-js
# or
yarn add @dcisionai/sdk-js
```

## Quickstart
```ts
import { solveLaborScheduling } from '@dcisionai/sdk-js';

(async () => {
  const apiKey = process.env.DCISIONAI_API_KEY!;
  const problem = {
    employees: [],
    shifts: [],
    time_horizon: 7,
    constraints: {},
    objective: 'minimize_cost'
  };
  const res = await solveLaborScheduling(apiKey, problem);
  console.log(res);
})();
```

## API Methods
- `createClient(apiKey: string, baseUrl?: string)` - Base client
- `solveLaborScheduling(apiKey, model, options?)`
- `solveResourceAllocation(apiKey, model, options?)`
- `solveProjectScheduling(apiKey, model, options?)`
- `solveMaterialDeliveryPlanning(apiKey, model, options?)`
- `solveRiskSimulation(apiKey, model, options?)`

## Advanced Usage
- Polling job status with `getMcpStatusSessionId`
- Submit custom MCP JSON via `postMcpSubmit`

## API Spec
OpenAPI definition: [`openapi.json`](./openapi.json)

## License
MIT