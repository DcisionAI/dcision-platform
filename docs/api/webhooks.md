# Webhook Guide

This document provides comprehensive documentation for webhooks in the DcisionAI platform.

## Overview

Webhooks allow you to receive real-time notifications about events in the DcisionAI platform. When an event occurs, the platform sends an HTTP POST request to your configured webhook URL.

## Webhook Events

### 1. Project Events

| Event Type          | Description                                      |
|---------------------|--------------------------------------------------|
| `project.created`   | A new project has been created                   |
| `project.updated`   | An existing project has been updated             |
| `project.deleted`   | A project has been deleted                       |

### 2. Model Events

| Event Type          | Description                                      |
|---------------------|--------------------------------------------------|
| `model.created`     | A new model has been created                     |
| `model.updated`     | An existing model has been updated               |
| `model.deleted`     | A model has been deleted                         |
| `model.trained`     | A model has completed training                   |
| `model.deployed`    | A model has been deployed                        |

### 3. Prediction Events

| Event Type          | Description                                      |
|---------------------|--------------------------------------------------|
| `prediction.created`| A new prediction has been created                |
| `prediction.updated`| An existing prediction has been updated          |
| `prediction.deleted`| A prediction has been deleted                    |
| `prediction.completed`| A prediction has completed processing           |

### 4. Dataset Events

| Event Type          | Description                                      |
|---------------------|--------------------------------------------------|
| `dataset.created`   | A new dataset has been created                   |
| `dataset.updated`   | An existing dataset has been updated             |
| `dataset.deleted`   | A dataset has been deleted                       |
| `dataset.processed` | A dataset has completed processing               |

## Webhook Management

### 1. Creating a Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "name": "Production Webhook",
  "description": "Webhook for production environment",
  "url": "https://api.example.com/webhooks/dcisionai",
  "events": [
    "project.created",
    "model.trained",
    "prediction.completed"
  ],
  "secret": "webhook_secret_1234567890"
}
```

Response:

```json
{
  "data": {
    "id": "wh_1234567890",
    "name": "Production Webhook",
    "description": "Webhook for production environment",
    "url": "https://api.example.com/webhooks/dcisionai",
    "events": [
      "project.created",
      "model.trained",
      "prediction.completed"
    ],
    "secret": "webhook_secret_1234567890",
    "created_at": "2023-01-01T00:00:00Z",
    "last_delivery_at": null,
    "status": "active"
  }
}
```

### 2. Listing Webhooks

```http
GET /webhooks
```

Response:

```json
{
  "data": [
    {
      "id": "wh_1234567890",
      "name": "Production Webhook",
      "description": "Webhook for production environment",
      "url": "https://api.example.com/webhooks/dcisionai",
      "events": [
        "project.created",
        "model.trained",
        "prediction.completed"
      ],
      "created_at": "2023-01-01T00:00:00Z",
      "last_delivery_at": null,
      "status": "active"
    }
  ]
}
```

### 3. Retrieving a Webhook

```http
GET /webhooks/wh_1234567890
```

### 4. Updating a Webhook

```http
PUT /webhooks/wh_1234567890
Content-Type: application/json

{
  "name": "Updated Webhook",
  "description": "Updated description",
  "url": "https://api.example.com/webhooks/dcisionai/updated",
  "events": [
    "project.created",
    "model.trained",
    "prediction.completed",
    "dataset.processed"
  ]
}
```

### 5. Deleting a Webhook

```http
DELETE /webhooks/wh_1234567890
```

## Webhook Payload

### 1. Project Created

```json
{
  "event": "project.created",
  "data": {
    "id": "proj_1234567890",
    "name": "My Project",
    "description": "Project description",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### 2. Model Trained

```json
{
  "event": "model.trained",
  "data": {
    "id": "model_1234567890",
    "project_id": "proj_1234567890",
    "name": "My Model",
    "description": "Model description",
    "status": "trained",
    "metrics": {
      "accuracy": 0.95,
      "precision": 0.94,
      "recall": 0.96,
      "f1": 0.95
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### 3. Prediction Completed

```json
{
  "event": "prediction.completed",
  "data": {
    "id": "pred_1234567890",
    "project_id": "proj_1234567890",
    "model_id": "model_1234567890",
    "input": {
      "feature1": 0.5,
      "feature2": 0.7
    },
    "output": {
      "prediction": 0.8,
      "confidence": 0.95
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

## Webhook Security

### 1. Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(request) {
  const signature = request.headers['x-dcisionai-signature'];
  const timestamp = request.headers['x-dcisionai-timestamp'];
  const payload = request.body;
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 2. Timestamp Verification

```javascript
function verifyTimestamp(request) {
  const timestamp = parseInt(request.headers['x-dcisionai-timestamp']);
  const now = Math.floor(Date.now() / 1000);
  
  // Allow 5 minutes of clock drift
  return Math.abs(now - timestamp) <= 300;
}
```

## Webhook Implementation Examples

### 1. Express.js

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhooks/dcisionai', (req, res) => {
  const signature = req.headers['x-dcisionai-signature'];
  const timestamp = req.headers['x-dcisionai-timestamp'];
  
  if (!verifyWebhook(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  if (!verifyTimestamp(req)) {
    return res.status(401).json({ error: 'Invalid timestamp' });
  }
  
  const event = req.body.event;
  const data = req.body.data;
  
  switch (event) {
    case 'project.created':
      handleProjectCreated(data);
      break;
    case 'model.trained':
      handleModelTrained(data);
      break;
    case 'prediction.completed':
      handlePredictionCompleted(data);
      break;
  }
  
  res.status(200).json({ received: true });
});

app.listen(3000);
```

### 2. Flask

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import time

app = Flask(__name__)

@app.route('/webhooks/dcisionai', methods=['POST'])
def webhook():
    signature = request.headers.get('X-DcisionAI-Signature')
    timestamp = request.headers.get('X-DcisionAI-Timestamp')
    
    if not verify_webhook(request):
        return jsonify({'error': 'Invalid signature'}), 401
    
    if not verify_timestamp(request):
        return jsonify({'error': 'Invalid timestamp'}), 401
    
    event = request.json['event']
    data = request.json['data']
    
    if event == 'project.created':
        handle_project_created(data)
    elif event == 'model.trained':
        handle_model_trained(data)
    elif event == 'prediction.completed':
        handle_prediction_completed(data)
    
    return jsonify({'received': True})

def verify_webhook(request):
    signature = request.headers.get('X-DcisionAI-Signature')
    timestamp = request.headers.get('X-DcisionAI-Timestamp')
    payload = request.get_data()
    
    expected_signature = hmac.new(
        os.getenv('WEBHOOK_SECRET').encode(),
        f'{timestamp}.{payload.decode()}'.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

def verify_timestamp(request):
    timestamp = int(request.headers.get('X-DcisionAI-Timestamp'))
    now = int(time.time())
    
    return abs(now - timestamp) <= 300

if __name__ == '__main__':
    app.run(port=3000)
```

### 3. Spring Boot

```java
@RestController
@RequestMapping("/webhooks/dcisionai")
public class WebhookController {
    
    @PostMapping
    public ResponseEntity<?> handleWebhook(
        @RequestHeader("X-DcisionAI-Signature") String signature,
        @RequestHeader("X-DcisionAI-Timestamp") String timestamp,
        @RequestBody WebhookPayload payload
    ) {
        if (!verifyWebhook(signature, timestamp, payload)) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Invalid signature")
            );
        }
        
        if (!verifyTimestamp(timestamp)) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Invalid timestamp")
            );
        }
        
        switch (payload.getEvent()) {
            case "project.created":
                handleProjectCreated(payload.getData());
                break;
            case "model.trained":
                handleModelTrained(payload.getData());
                break;
            case "prediction.completed":
                handlePredictionCompleted(payload.getData());
                break;
        }
        
        return ResponseEntity.ok(Map.of("received", true));
    }
    
    private boolean verifyWebhook(String signature, String timestamp, WebhookPayload payload) {
        String secret = System.getenv("WEBHOOK_SECRET");
        String message = timestamp + "." + payload.toString();
        
        String expectedSignature = HmacUtils.hmacSha256Hex(
            secret.getBytes(),
            message.getBytes()
        );
        
        return MessageDigest.isEqual(
            signature.getBytes(),
            expectedSignature.getBytes()
        );
    }
    
    private boolean verifyTimestamp(String timestamp) {
        long now = System.currentTimeMillis() / 1000;
        long webhookTime = Long.parseLong(timestamp);
        
        return Math.abs(now - webhookTime) <= 300;
    }
}
```

### 4. Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "strconv"
    "time"
)

type WebhookPayload struct {
    Event string                 `json:"event"`
    Data  map[string]interface{} `json:"data"`
}

func main() {
    http.HandleFunc("/webhooks/dcisionai", handleWebhook)
    http.ListenAndServe(":3000", nil)
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-DcisionAI-Signature")
    timestamp := r.Header.Get("X-DcisionAI-Timestamp")
    
    var payload WebhookPayload
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, "Invalid payload", http.StatusBadRequest)
        return
    }
    
    if !verifyWebhook(signature, timestamp, payload) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    if !verifyTimestamp(timestamp) {
        http.Error(w, "Invalid timestamp", http.StatusUnauthorized)
        return
    }
    
    switch payload.Event {
    case "project.created":
        handleProjectCreated(payload.Data)
    case "model.trained":
        handleModelTrained(payload.Data)
    case "prediction.completed":
        handlePredictionCompleted(payload.Data)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]bool{"received": true})
}

func verifyWebhook(signature, timestamp string, payload WebhookPayload) bool {
    secret := os.Getenv("WEBHOOK_SECRET")
    message := fmt.Sprintf("%s.%s", timestamp, payload)
    
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write([]byte(message))
    expectedSignature := hex.EncodeToString(mac.Sum(nil))
    
    return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func verifyTimestamp(timestamp string) bool {
    webhookTime, err := strconv.ParseInt(timestamp, 10, 64)
    if err != nil {
        return false
    }
    
    now := time.Now().Unix()
    return abs(now-webhookTime) <= 300
}

func abs(x int64) int64 {
    if x < 0 {
        return -x
    }
    return x
}
```

## Best Practices

### 1. Webhook Queue

```javascript
class WebhookQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(webhook) {
    return new Promise((resolve, reject) => {
      this.queue.push({ webhook, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { webhook, resolve, reject } = this.queue.shift();
      
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DcisionAI-Signature': webhook.signature,
            'X-DcisionAI-Timestamp': webhook.timestamp
          },
          body: JSON.stringify(webhook.payload)
        });
        
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(new Error(`Webhook delivery failed: ${response.status}`));
        }
      } catch (error) {
        reject(error);
      }
    }
    
    this.processing = false;
  }
}
```

### 2. Webhook Retry

```javascript
class WebhookRetry {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }
  
  async deliver(webhook) {
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DcisionAI-Signature': webhook.signature,
            'X-DcisionAI-Timestamp': webhook.timestamp
          },
          body: JSON.stringify(webhook.payload)
        });
        
        if (response.ok) {
          return response.json();
        }
        
        retryCount++;
        const delay = this.baseDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        retryCount++;
        if (retryCount === this.maxRetries) {
          throw error;
        }
        
        const delay = this.baseDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
}
```

### 3. Webhook Monitoring

```javascript
class WebhookMonitor {
  constructor() {
    this.deliveries = [];
    this.windowSize = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  trackDelivery(webhookId, status, responseTime) {
    const now = Date.now();
    this.deliveries = this.deliveries.filter(
      delivery => now - delivery.timestamp < this.windowSize
    );
    
    this.deliveries.push({
      webhookId,
      status,
      responseTime,
      timestamp: now
    });
  }
  
  getDeliveryStats(webhookId) {
    const now = Date.now();
    const webhookDeliveries = this.deliveries.filter(
      delivery => delivery.webhookId === webhookId &&
                 now - delivery.timestamp < this.windowSize
    );
    
    const total = webhookDeliveries.length;
    const successful = webhookDeliveries.filter(
      delivery => delivery.status === 'success'
    ).length;
    
    const averageResponseTime = webhookDeliveries.reduce(
      (sum, delivery) => sum + delivery.responseTime,
      0
    ) / total;
    
    return {
      total,
      successful,
      failed: total - successful,
      successRate: (successful / total) * 100,
      averageResponseTime
    };
  }
}
```

## Related Documents

- [API Documentation](../api/README.md)
- [Authentication Guide](../api/authentication.md)
- [Rate Limiting Guide](../api/rate-limiting.md) 
- [Rate Limiting Guide](../api/rate-limiting.md) 