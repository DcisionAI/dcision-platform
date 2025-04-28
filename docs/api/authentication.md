# Authentication Guide

This document provides comprehensive documentation for authentication in the DcisionAI platform.

## Overview

The DcisionAI platform uses API keys for authentication. Each API request must include an API key in the `Authorization` header.

## API Key Management

### 1. Creating an API Key

```http
POST /api-keys
Content-Type: application/json

{
  "name": "Production API Key",
  "description": "API key for production environment",
  "permissions": [
    "projects:read",
    "projects:write",
    "models:read",
    "models:write",
    "predictions:read",
    "predictions:write"
  ]
}
```

Response:

```json
{
  "data": {
    "id": "ak_1234567890",
    "name": "Production API Key",
    "description": "API key for production environment",
    "key": "sk_live_1234567890abcdefghijklmnopqrstuvwxyz",
    "permissions": [
      "projects:read",
      "projects:write",
      "models:read",
      "models:write",
      "predictions:read",
      "predictions:write"
    ],
    "created_at": "2023-01-01T00:00:00Z",
    "last_used_at": null,
    "status": "active"
  }
}
```

### 2. Listing API Keys

```http
GET /api-keys
```

Response:

```json
{
  "data": [
    {
      "id": "ak_1234567890",
      "name": "Production API Key",
      "description": "API key for production environment",
      "permissions": [
        "projects:read",
        "projects:write",
        "models:read",
        "models:write",
        "predictions:read",
        "predictions:write"
      ],
      "created_at": "2023-01-01T00:00:00Z",
      "last_used_at": null,
      "status": "active"
    }
  ]
}
```

### 3. Retrieving an API Key

```http
GET /api-keys/ak_1234567890
```

### 4. Updating an API Key

```http
PUT /api-keys/ak_1234567890
Content-Type: application/json

{
  "name": "Updated API Key",
  "description": "Updated description",
  "permissions": [
    "projects:read",
    "projects:write",
    "models:read",
    "models:write",
    "predictions:read",
    "predictions:write",
    "datasets:read",
    "datasets:write"
  ]
}
```

### 5. Deleting an API Key

```http
DELETE /api-keys/ak_1234567890
```

## Authentication Headers

### 1. API Key

```http
Authorization: Bearer sk_live_1234567890abcdefghijklmnopqrstuvwxyz
```

### 2. API Version

```http
X-API-Version: 2023-01-01
```

## Authentication Implementation Examples

### 1. JavaScript/TypeScript

```typescript
async function makeRequest() {
  try {
    const response = await fetch('https://api.dcisionai.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${process.env.DCISIONAI_API_KEY}`,
        'X-API-Version': '2023-01-01'
      }
    });
    
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

### 2. Python

```python
import requests
import os

def make_request():
    try:
        response = requests.get(
            'https://api.dcisionai.com/v1/projects',
            headers={
                'Authorization': f'Bearer {os.getenv("DCISIONAI_API_KEY")}',
                'X-API-Version': '2023-01-01'
            }
        )
        
        if response.status_code == 401:
            raise Exception('Invalid API key')
            
        return response.json()
    except Exception as e:
        print(f'API request failed: {e}')
        raise
```

### 3. Java

```java
public class ApiClient {
    private static final HttpClient client = HttpClient.newHttpClient();
    
    public static String makeRequest() throws Exception {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.dcisionai.com/v1/projects"))
                .header("Authorization", "Bearer " + System.getenv("DCISIONAI_API_KEY"))
                .header("X-API-Version", "2023-01-01")
                .build();
            
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 401) {
                throw new Exception("Invalid API key");
            }
            
            return response.body();
        } catch (Exception e) {
            System.err.println("API request failed: " + e.getMessage());
            throw e;
        }
    }
}
```

### 4. Go

```go
func makeRequest() (string, error) {
    req, err := http.NewRequest("GET", "https://api.dcisionai.com/v1/projects", nil)
    if err != nil {
        return "", err
    }
    
    req.Header.Set("Authorization", "Bearer "+os.Getenv("DCISIONAI_API_KEY"))
    req.Header.Set("X-API-Version", "2023-01-01")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 401 {
        return "", fmt.Errorf("Invalid API key")
    }
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    
    return string(body), nil
}
```

## Best Practices

### 1. API Key Rotation

```javascript
class ApiKeyRotator {
  constructor() {
    this.apiKeys = new Map();
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  async rotateApiKey(apiKeyId) {
    const newApiKey = await createApiKey({
      name: `Rotated API Key ${Date.now()}`,
      description: 'Automatically rotated API key',
      permissions: this.apiKeys.get(apiKeyId).permissions
    });
    
    this.apiKeys.set(apiKeyId, {
      ...newApiKey,
      rotationTime: Date.now()
    });
    
    await deleteApiKey(apiKeyId);
    
    return newApiKey;
  }
  
  async getApiKey(apiKeyId) {
    const apiKey = this.apiKeys.get(apiKeyId);
    
    if (!apiKey) {
      throw new Error('API key not found');
    }
    
    if (Date.now() - apiKey.rotationTime > this.rotationInterval) {
      return this.rotateApiKey(apiKeyId);
    }
    
    return apiKey;
  }
}
```

### 2. API Key Validation

```javascript
class ApiKeyValidator {
  constructor() {
    this.apiKeys = new Map();
  }
  
  async validateApiKey(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    if (!apiKey.startsWith('sk_')) {
      throw new Error('Invalid API key format');
    }
    
    const apiKeyData = this.apiKeys.get(apiKey);
    
    if (!apiKeyData) {
      throw new Error('API key not found');
    }
    
    if (apiKeyData.status !== 'active') {
      throw new Error('API key is not active');
    }
    
    return apiKeyData;
  }
  
  async validatePermissions(apiKey, requiredPermissions) {
    const apiKeyData = await this.validateApiKey(apiKey);
    
    for (const permission of requiredPermissions) {
      if (!apiKeyData.permissions.includes(permission)) {
        throw new Error(`Missing required permission: ${permission}`);
      }
    }
    
    return true;
  }
}
```

### 3. API Key Monitoring

```javascript
class ApiKeyMonitor {
  constructor() {
    this.usage = new Map();
    this.windowSize = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  trackUsage(apiKeyId, endpoint, status, responseTime) {
    const now = Date.now();
    this.usage = this.usage.filter(
      usage => now - usage.timestamp < this.windowSize
    );
    
    this.usage.push({
      apiKeyId,
      endpoint,
      status,
      responseTime,
      timestamp: now
    });
  }
  
  getUsageStats(apiKeyId) {
    const now = Date.now();
    const apiKeyUsage = this.usage.filter(
      usage => usage.apiKeyId === apiKeyId &&
              now - usage.timestamp < this.windowSize
    );
    
    const total = apiKeyUsage.length;
    const successful = apiKeyUsage.filter(
      usage => usage.status === 'success'
    ).length;
    
    const averageResponseTime = apiKeyUsage.reduce(
      (sum, usage) => sum + usage.responseTime,
      0
    ) / total;
    
    const endpoints = apiKeyUsage.reduce((endpoints, usage) => {
      endpoints[usage.endpoint] = (endpoints[usage.endpoint] || 0) + 1;
      return endpoints;
    }, {});
    
    return {
      total,
      successful,
      failed: total - successful,
      successRate: (successful / total) * 100,
      averageResponseTime,
      endpoints
    };
  }
}
```

## Related Documents

- [API Documentation](../api/README.md)
- [Rate Limiting Guide](../api/rate-limiting.md)
- [Webhook Guide](../api/webhooks.md) 