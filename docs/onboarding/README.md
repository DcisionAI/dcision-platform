# Developer Onboarding Guide

Welcome to the DcisionAI development team! This guide will help you get started with the codebase and understand how to contribute effectively.

## Quick Start

1. [Development Environment Setup](./environment-setup.md)
2. [Codebase Overview](./codebase-overview.md)
3. [Technology Stack](./technology-stack.md)
4. [Adding New Features](./adding-features.md)
5. [Example: Portfolio Management](./examples/portfolio-management.md)

## Learning Path

### Week 1: Getting Started
- [ ] Set up development environment
- [ ] Understand the codebase structure
- [ ] Learn the technology stack
- [ ] Run the application locally

### Week 2: Core Concepts
- [ ] Understand MCP (Model Context Protocol)
- [ ] Learn about agent architecture
- [ ] Study the UI components
- [ ] Review testing practices

### Week 3: Development Workflow
- [ ] Learn the git workflow
- [ ] Understand code review process
- [ ] Study deployment pipeline
- [ ] Review monitoring and logging

### Week 4: Advanced Topics
- [ ] Deep dive into MCP implementation
- [ ] Study agent communication
- [ ] Learn about optimization models
- [ ] Understand data flow

## Support Resources

- [Documentation](./)
- [API Reference](../api/README.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [FAQ](./faq.md)

## Getting Help

- Team Slack channel: #dev-support
- Engineering meetings: Daily standup at 10 AM
- Code review process: See [Code Review Guidelines](./code-review.md)
- Emergency support: Contact tech lead

## Next Steps

1. Complete the [Development Environment Setup](./environment-setup.md)
2. Review the [Codebase Overview](./codebase-overview.md)
3. Study the [Technology Stack](./technology-stack.md)
4. Try the [Portfolio Management Example](./examples/portfolio-management.md)

## Pinecone Integration

DcisionAI uses Pinecone as a vector database for storing and searching documentation embeddings.

### Upserting Documentation to Pinecone

To (re)ingest your documentation into Pinecone, use the upsert script. For best compatibility, use a separate TypeScript config for scripts:

1. Create a `tsconfig.scripts.json` in your project root:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs"
  },
  "include": ["scripts/**/*.ts"]
}
```

2. Run the upsert script with:

```sh
npx ts-node --project tsconfig.scripts.json scripts/upsertDocsToPinecone.ts
```

This will delete all vectors in your Pinecone namespace and upsert your documentation in section-based chunks.

See the script in `scripts/upsertDocsToPinecone.ts` for details. 