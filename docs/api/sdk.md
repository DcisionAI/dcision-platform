# SDK Documentation

This document provides detailed information about the DcisionAI SDKs.

## Overview

The DcisionAI platform provides official SDKs for:

1. JavaScript/TypeScript
2. Python
3. Java
4. Go

## JavaScript/TypeScript SDK

### 1. Installation

```bash
npm install @dcisionai/sdk
# or
yarn add @dcisionai/sdk
```

### 2. Basic Usage

```typescript
import { DcisionAI } from '@dcisionai/sdk';

const client = new DcisionAI({
  apiKey: 'your-api-key'
});

// List projects
const projects = await client.projects.list();

// Create project
const project = await client.projects.create({
  name: 'My Project',
  description: 'A new project'
});

// Train model
const model = await client.models.train({
  project_id: project.id,
  data: {
    features: ['feature1', 'feature2'],
    target: 'target'
  },
  parameters: {
    algorithm: 'random_forest',
    max_depth: 10
  }
});

// Make prediction
const prediction = await client.predictions.create({
  model_id: model.id,
  input: {
    feature1: 1.0,
    feature2: 2.0
  }
});
```

### 3. Error Handling

```typescript
try {
  const project = await client.projects.create({
    name: 'My Project'
  });
} catch (error) {
  if (error instanceof DcisionAIError) {
    console.error('API Error:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
  }
}
```

### 4. Pagination

```typescript
// List all projects
const allProjects = [];
let page = 1;

while (true) {
  const { data, meta } = await client.projects.list({
    page,
    limit: 100
  });

  allProjects.push(...data);

  if (page >= meta.pages) {
    break;
  }

  page++;
}
```

### 5. Webhooks

```typescript
// Create webhook
const webhook = await client.webhooks.create({
  url: 'https://your-domain.com/webhooks',
  events: ['model.trained', 'prediction.made'],
  secret: 'your-webhook-secret'
});

// List webhooks
const webhooks = await client.webhooks.list();

// Delete webhook
await client.webhooks.delete(webhook.id);
```

## Python SDK

### 1. Installation

```bash
pip install dcisionai
```

### 2. Basic Usage

```python
from dcisionai import Client

client = Client(api_key='your-api-key')

# List projects
projects = client.projects.list()

# Create project
project = client.projects.create(
    name='My Project',
    description='A new project'
)

# Train model
model = client.models.train(
    project_id=project.id,
    data={
        'features': ['feature1', 'feature2'],
        'target': 'target'
    },
    parameters={
        'algorithm': 'random_forest',
        'max_depth': 10
    }
)

# Make prediction
prediction = client.predictions.create(
    model_id=model.id,
    input={
        'feature1': 1.0,
        'feature2': 2.0
    }
)
```

### 3. Error Handling

```python
try:
    project = client.projects.create(
        name='My Project'
    )
except dcisionai.error.DcisionAIError as e:
    print(f'API Error: {e.message}')
    print(f'Code: {e.code}')
    print(f'Details: {e.details}')
```

### 4. Pagination

```python
# List all projects
all_projects = []
page = 1

while True:
    response = client.projects.list(
        page=page,
        limit=100
    )
    
    all_projects.extend(response.data)
    
    if page >= response.meta.pages:
        break
        
    page += 1
```

### 5. Webhooks

```python
# Create webhook
webhook = client.webhooks.create(
    url='https://your-domain.com/webhooks',
    events=['model.trained', 'prediction.made'],
    secret='your-webhook-secret'
)

# List webhooks
webhooks = client.webhooks.list()

# Delete webhook
client.webhooks.delete(webhook.id)
```

## Java SDK

### 1. Installation

```xml
<dependency>
  <groupId>com.dcisionai</groupId>
  <artifactId>sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

### 2. Basic Usage

```java
import com.dcisionai.DcisionAI;
import com.dcisionai.models.*;

DcisionAI client = new DcisionAI("your-api-key");

// List projects
List<Project> projects = client.projects().list();

// Create project
Project project = client.projects().create(
    new ProjectCreateRequest()
        .setName("My Project")
        .setDescription("A new project")
);

// Train model
Model model = client.models().train(
    new ModelTrainRequest()
        .setProjectId(project.getId())
        .setData(new ModelData()
            .setFeatures(Arrays.asList("feature1", "feature2"))
            .setTarget("target")
        )
        .setParameters(new ModelParameters()
            .setAlgorithm("random_forest")
            .setMaxDepth(10)
        )
);

// Make prediction
Prediction prediction = client.predictions().create(
    new PredictionCreateRequest()
        .setModelId(model.getId())
        .setInput(new HashMap<String, Object>() {{
            put("feature1", 1.0);
            put("feature2", 2.0);
        }})
);
```

### 3. Error Handling

```java
try {
    Project project = client.projects().create(
        new ProjectCreateRequest()
            .setName("My Project")
    );
} catch (DcisionAIException e) {
    System.err.println("API Error: " + e.getMessage());
    System.err.println("Code: " + e.getCode());
    System.err.println("Details: " + e.getDetails());
}
```

## Go SDK

### 1. Installation

```bash
go get github.com/dcisionai/sdk-go
```

### 2. Basic Usage

```go
package main

import (
    "context"
    "fmt"
    "github.com/dcisionai/sdk-go"
)

func main() {
    client := dcisionai.NewClient("your-api-key")

    // List projects
    projects, err := client.Projects.List(context.Background(), nil)
    if err != nil {
        panic(err)
    }

    // Create project
    project, err := client.Projects.Create(context.Background(), &dcisionai.ProjectCreateRequest{
        Name:        "My Project",
        Description: "A new project",
    })
    if err != nil {
        panic(err)
    }

    // Train model
    model, err := client.Models.Train(context.Background(), &dcisionai.ModelTrainRequest{
        ProjectID: project.ID,
        Data: &dcisionai.ModelData{
            Features: []string{"feature1", "feature2"},
            Target:   "target",
        },
        Parameters: &dcisionai.ModelParameters{
            Algorithm: "random_forest",
            MaxDepth:  10,
        },
    })
    if err != nil {
        panic(err)
    }

    // Make prediction
    prediction, err := client.Predictions.Create(context.Background(), &dcisionai.PredictionCreateRequest{
        ModelID: model.ID,
        Input: map[string]interface{}{
            "feature1": 1.0,
            "feature2": 2.0,
        },
    })
    if err != nil {
        panic(err)
    }
}
```

### 3. Error Handling

```go
project, err := client.Projects.Create(context.Background(), &dcisionai.ProjectCreateRequest{
    Name: "My Project",
})
if err != nil {
    if dcisionaiErr, ok := err.(*dcisionai.Error); ok {
        fmt.Printf("API Error: %s\n", dcisionaiErr.Message)
        fmt.Printf("Code: %s\n", dcisionaiErr.Code)
        fmt.Printf("Details: %v\n", dcisionaiErr.Details)
    }
    panic(err)
}
```

## Common Features

### 1. Configuration

All SDKs support configuration through environment variables:

```
DCISIONAI_API_KEY=your-api-key
DCISIONAI_API_URL=https://api.dcisionai.com/v1
```

### 2. Retry Logic

All SDKs implement automatic retry logic with exponential backoff for:
- Network errors
- Rate limiting
- Server errors

### 3. Logging

All SDKs support configurable logging:

```typescript
// JavaScript/TypeScript
const client = new DcisionAI({
  apiKey: 'your-api-key',
  logger: console
});

// Python
import logging
logging.basicConfig(level=logging.DEBUG)

// Java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
Logger logger = LoggerFactory.getLogger(DcisionAI.class);

// Go
import "log"
log.SetFlags(log.LstdFlags | log.Lshortfile)
```

## Related Documents

- [API Documentation](../api/README.md)
- [Authentication Guide](../api/authentication.md)
- [Webhook Guide](../api/webhooks.md) 