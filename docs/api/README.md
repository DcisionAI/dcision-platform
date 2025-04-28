# API Documentation

This document provides comprehensive documentation for the DcisionAI platform's API.

## Overview

The DcisionAI API is a RESTful API that provides access to the platform's core functionality. It is built using Node.js and Express, and uses TypeScript for type safety.

## Authentication

### 1. API Keys

- **Required Headers**
  ```
  Authorization: Bearer <api_key>
  ```

- **Obtaining API Keys**
  1. Log in to the platform
  2. Navigate to Settings > API Keys
  3. Generate a new API key
  4. Store securely

### 2. OAuth 2.0

- **Authorization Flow**
  1. Redirect to authorization endpoint
  2. User authenticates
  3. Receive authorization code
  4. Exchange for access token

- **Endpoints**
  ```
  POST /oauth/authorize
  POST /oauth/token
  POST /oauth/revoke
  ```

## Base URL

```
https://api.dcisionai.com/v1
```

## Endpoints

### 1. Users

#### Get User
```
GET /users/:id
```

**Response**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

#### Update User
```
PUT /users/:id
```

**Request**
```json
{
  "name": "string",
  "email": "string"
}
```

### 2. Projects

#### List Projects
```
GET /projects
```

**Query Parameters**
- `page`: number
- `limit`: number
- `sort`: string
- `filter`: object

**Response**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "created_at": "string"
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

#### Create Project
```
POST /projects
```

**Request**
```json
{
  "name": "string",
  "description": "string"
}
```

### 3. Models

#### Train Model
```
POST /models/train
```

**Request**
```json
{
  "project_id": "string",
  "data": "object",
  "parameters": "object"
}
```

#### Get Model
```
GET /models/:id
```

**Response**
```json
{
  "id": "string",
  "project_id": "string",
  "status": "string",
  "metrics": "object",
  "created_at": "string"
}
```

### 4. Predictions

#### Make Prediction
```
POST /predictions
```

**Request**
```json
{
  "model_id": "string",
  "input": "object"
}
```

**Response**
```json
{
  "prediction": "object",
  "confidence": "number",
  "metadata": "object"
}
```

## Error Handling

### 1. Error Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

### 2. Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

- 100 requests per minute
- 1000 requests per hour
- Headers included in response:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1609459200
  ```

## Pagination

### 1. Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field and direction
- `filter`: Filter criteria

### 2. Response Format

```json
{
  "data": [],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

## Webhooks

### 1. Events

- `model.trained`
- `prediction.made`
- `project.created`
- `user.updated`

### 2. Payload Format

```json
{
  "event": "string",
  "data": "object",
  "timestamp": "string"
}
```

## SDKs

### 1. JavaScript/TypeScript

```typescript
import { DcisionAI } from '@dcisionai/sdk';

const client = new DcisionAI({
  apiKey: 'your-api-key'
});

// Example usage
const projects = await client.projects.list();
```

### 2. Python

```python
from dcisionai import Client

client = Client(api_key='your-api-key')

# Example usage
projects = client.projects.list()
```

## Examples

### 1. Create Project

```javascript
const response = await fetch('https://api.dcisionai.com/v1/projects', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Project',
    description: 'A new project'
  })
});

const project = await response.json();
```

### 2. Train Model

```python
import requests

response = requests.post(
  'https://api.dcisionai.com/v1/models/train',
  headers={
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  json={
    'project_id': 'project-id',
    'data': {
      'features': ['feature1', 'feature2'],
      'target': 'target'
    },
    'parameters': {
      'algorithm': 'random_forest',
      'max_depth': 10
    }
  }
)

model = response.json()
```

## Related Documents

- [Authentication Guide](./authentication.md)
- [Webhook Guide](./webhooks.md)
- [SDK Documentation](./sdk.md) 