# Rate Limiting Guide

This document provides comprehensive documentation for rate limiting in the DcisionAI platform.

## Overview

The DcisionAI platform implements rate limiting to ensure fair usage and prevent abuse. Rate limits are applied per API key and are based on the number of requests per minute.

## Rate Limit Headers

### 1. Current Rate Limit

```http
X-RateLimit-Limit: 60
```

### 2. Remaining Requests

```http
X-RateLimit-Remaining: 59
```

### 3. Reset Time

```http
X-RateLimit-Reset: 1625097600
```

## Rate Limit Tiers

### 1. Free Tier

| Feature           | Limit                     |
|-------------------|---------------------------|
| Requests/minute   | 60                        |
| Projects          | 3                         |
| Models            | 5                         |
| Predictions/day   | 1,000                     |
| Datasets          | 5                         |

### 2. Pro Tier

| Feature           | Limit                     |
|-------------------|---------------------------|
| Requests/minute   | 300                       |
| Projects          | 20                        |
| Models            | 50                        |
| Predictions/day   | 10,000                    |
| Datasets          | 50                        |

### 3. Enterprise Tier

| Feature           | Limit                     |
|-------------------|---------------------------|
| Requests/minute   | 1,000                     |
| Projects          | Unlimited                 |
| Models            | Unlimited                 |
| Predictions/day   | 100,000                   |
| Datasets          | Unlimited                 |

## Rate Limit Responses

### 1. Rate Limit Exceeded

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Please try again in 60 seconds.",
    "status": 429,
    "retry_after": 60
  }
}
```

### 2. Quota Exceeded

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Daily prediction quota exceeded. Please upgrade your plan.",
    "status": 429,
    "retry_after": 86400
  }
}
```

## Rate Limit Implementation Examples

### 1. JavaScript/TypeScript

```typescript
async function makeRequest() {
  try {
    const response = await fetch('https://api.dcisionai.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${process.env.DCISIONAI_API_KEY}`
      }
    });
    
    const rateLimit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return makeRequest();
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
import time

def make_request():
    try:
        response = requests.get(
            'https://api.dcisionai.com/v1/projects',
            headers={'Authorization': f'Bearer {os.getenv("DCISIONAI_API_KEY")}'}
        )
        
        rate_limit = response.headers.get('X-RateLimit-Limit')
        remaining = response.headers.get('X-RateLimit-Remaining')
        reset = response.headers.get('X-RateLimit-Reset')
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After'))
            time.sleep(retry_after)
            return make_request()
        
        return response.json()
    except Exception as e:
        print(f'API request failed: {e}')
        raise
```

### 3. Java

```java
public class RateLimiter {
    private static final HttpClient client = HttpClient.newHttpClient();
    
    public static String makeRequest() throws Exception {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.dcisionai.com/v1/projects"))
                .header("Authorization", "Bearer " + System.getenv("DCISIONAI_API_KEY"))
                .build();
            
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            String rateLimit = response.headers().firstValue("X-RateLimit-Limit").orElse(null);
            String remaining = response.headers().firstValue("X-RateLimit-Remaining").orElse(null);
            String reset = response.headers().firstValue("X-RateLimit-Reset").orElse(null);
            
            if (response.statusCode() == 429) {
                String retryAfter = response.headers().firstValue("Retry-After").orElse("60");
                Thread.sleep(Long.parseLong(retryAfter) * 1000);
                return makeRequest();
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
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    rateLimit := resp.Header.Get("X-RateLimit-Limit")
    remaining := resp.Header.Get("X-RateLimit-Remaining")
    reset := resp.Header.Get("X-RateLimit-Reset")
    
    if resp.StatusCode == 429 {
        retryAfter, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
        time.Sleep(time.Duration(retryAfter) * time.Second)
        return makeRequest()
    }
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    
    return string(body), nil
}
```

## Best Practices

### 1. Exponential Backoff

```javascript
async function makeRequestWithBackoff() {
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch('https://api.dcisionai.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${process.env.DCISIONAI_API_KEY}`
        }
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = Math.min(
          baseDelay * Math.pow(2, retryCount),
          30000 // Max 30 seconds
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
        continue;
      }
      
      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### 2. Request Queue

```javascript
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.rateLimit = 60;
    this.remaining = 60;
    this.resetTime = Date.now() + 60000;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      if (this.remaining <= 0) {
        const now = Date.now();
        if (now < this.resetTime) {
          await new Promise(resolve => 
            setTimeout(resolve, this.resetTime - now)
          );
        }
        this.remaining = this.rateLimit;
        this.resetTime = Date.now() + 60000;
      }
      
      const { request, resolve, reject } = this.queue.shift();
      
      try {
        const response = await fetch(request.url, {
          headers: {
            'Authorization': `Bearer ${process.env.DCISIONAI_API_KEY}`
          }
        });
        
        this.remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
        this.resetTime = parseInt(response.headers.get('X-RateLimit-Reset')) * 1000;
        
        resolve(response.json());
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}
```

### 3. Rate Limit Monitoring

```javascript
class RateLimitMonitor {
  constructor() {
    this.requests = [];
    this.windowSize = 60000; // 1 minute
  }
  
  trackRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowSize
    );
    this.requests.push(now);
  }
  
  getRemainingRequests(limit) {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowSize
    );
    return limit - this.requests.length;
  }
  
  getResetTime() {
    if (this.requests.length === 0) {
      return Date.now();
    }
    return this.requests[0] + this.windowSize;
  }
}
```

## Related Documents

- [API Documentation](../api/README.md)
- [Authentication Guide](../api/authentication.md)
- [Webhook Guide](../api/webhooks.md) 