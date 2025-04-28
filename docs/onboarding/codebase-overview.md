# Codebase Overview

This document provides an overview of the DcisionAI platform's codebase structure and organization.

## Project Structure

```
dcisionai-platform/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Next.js pages
│   └── styles/             # CSS and themes
├── server/                 # Backend source code
│   ├── src/                # Server source
│   ├── tests/              # Server tests
│   └── config/             # Server configuration
├── docs/                   # Documentation
│   ├── onboarding/         # Onboarding docs
│   ├── api/                # API documentation
│   └── guides/             # User guides
└── scripts/                # Build and utility scripts
```

## Frontend Architecture

### 1. Components

- **Common Components**
  - Reusable UI elements
  - Form components
  - Layout components
  - Navigation components

- **Feature Components**
  - Feature-specific UI
  - Business logic
  - State management
  - API integration

### 2. State Management

- **Context API**
  - Global state
  - Theme management
  - User preferences
  - Authentication state

- **Local State**
  - Component state
  - Form state
  - UI state
  - Loading states

### 3. Data Fetching

- **API Integration**
  - REST endpoints
  - GraphQL queries
  - WebSocket connections
  - Real-time updates

- **Caching**
  - SWR/React Query
  - Local storage
  - Session storage
  - Memory cache

## Backend Architecture

### 1. API Layer

- **Controllers**
  - Request handling
  - Input validation
  - Response formatting
  - Error handling

- **Routes**
  - Endpoint definitions
  - Middleware
  - Authentication
  - Rate limiting

### 2. Business Logic

- **Services**
  - Business rules
  - Data processing
  - External integrations
  - Complex operations

- **Models**
  - Data structures
  - Database schemas
  - Validation rules
  - Relationships

### 3. Data Access

- **Database**
  - PostgreSQL
  - Supabase
  - Migrations
  - Queries

- **Caching**
  - Redis
  - Memory cache
  - Query caching
  - Session storage

## Key Features

### 1. Authentication

- User registration
- Login/logout
- Password reset
- Social login
- Role-based access

### 2. Data Management

- CRUD operations
- File uploads
- Data validation
- Batch processing
- Real-time updates

### 3. AI Integration

- OpenAI API
- Model training
- Prediction services
- Data processing
- Result analysis

## Development Workflow

### 1. Local Development

- Environment setup
- Hot reloading
- Debugging
- Testing
- Linting

### 2. Testing

- Unit tests
- Integration tests
- E2E tests
- Performance tests
- Security tests

### 3. Deployment

- CI/CD pipeline
- Staging environment
- Production deployment
- Monitoring
- Rollback procedures

## Best Practices

### 1. Code Organization

- Modular structure
- Clear naming
- Consistent patterns
- Documentation
- Type safety

### 2. Performance

- Code splitting
- Lazy loading
- Caching
- Optimization
- Monitoring

### 3. Security

- Input validation
- Authentication
- Authorization
- Encryption
- Audit logging

## Common Patterns

### 1. Component Structure

```typescript
// Component with props and state
interface Props {
  // ...
}

function Component({ prop1, prop2 }: Props) {
  const [state, setState] = useState();

  // ...
}
```

### 2. API Endpoint

```typescript
// REST endpoint with error handling
async function handler(req: Request, res: Response) {
  try {
    // ...
  } catch (error) {
    // ...
  }
}
```

### 3. Database Query

```typescript
// Database operation with error handling
async function query() {
  try {
    // ...
  } catch (error) {
    // ...
  }
}
```

## Related Documents

- [Development Environment Setup](./environment-setup.md)
- [Technology Stack](./technology-stack.md)
- [Adding New Features](./adding-features.md) 