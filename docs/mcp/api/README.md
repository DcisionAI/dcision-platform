# MCP API Reference

## Overview

The MCP API provides endpoints for submitting optimization problems, retrieving results, and managing model configurations on the DcisionAI platform. MCP stands for Model Context Protocol.

## Base URL

```
https://api.dcisionai.com/mcp
```

## Authentication

All endpoints require an API key via the `Authorization` header:
```
Authorization: Bearer <your-api-key>
```

## Endpoints

### 1. Submit a Problem

**POST** `/problems`

Submit a new optimization problem.

#### Request Body
```json
{
  "model": { /* MCPModel object */ },
  "context": { /* Context info */ }
}
```

#### Response
```json
{
  "problemId": "abc123",
  "status": "pending"
}
```

### 2. Get Problem Status

**GET** `/problems/{problemId}`

Retrieve the status and details of a submitted problem.

#### Response
```json
{
  "problemId": "abc123",
  "status": "completed",
  "result": { /* Solution object */ }
}
```

### 3. List Problems

**GET** `/problems`

List all submitted problems for the authenticated user.

#### Response
```json
[
  { "problemId": "abc123", "status": "completed" },
  { "problemId": "def456", "status": "pending" }
]
```

### 4. Delete a Problem

**DELETE** `/problems/{problemId}`

Delete a problem and its results.

#### Response
```json
{
  "success": true
}
```

## Error Handling

All errors return a JSON object with an `error` field:
```json
{
  "error": "Invalid API key."
}
```

## WebSocket Updates

For real-time updates, connect to:
```
wss://api.dcisionai.com/mcp/updates
```

## Example Usage

See [Usage Examples](../examples/README.md) for sample API requests and model configurations. 