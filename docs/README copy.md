# DcisionAI Platform

A modern, cloud-native platform for construction optimization and decision-making using mathematical optimization techniques.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker (for deployment)
- Google Cloud Platform account (for production deployment)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Deployment

```bash
# Deploy to Google Cloud Run
gcloud builds submit --config cloudbuild.yaml .
```

## 🏗️ Architecture

DcisionAI uses a **single-service architecture** with the Next.js application handling both frontend and solver functionality:

```
┌─────────────────────────────────────────────────────────┐
│                Next.js Application                      │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │   Frontend UI   │  │        API Routes               │ │
│  │                 │  │                                 │ │
│  │ - Construction  │  │ - /api/solver/solve            │ │
│  │ - Retail        │  │ - /api/construction/chat       │ │
│  │ - Finance       │  │ - /api/retail/chat             │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Solver Layer                           │ │
│  │                                                     │ │
│  │ - HiGHS (implemented - mock)                       │ │
│  │ - OR-Tools (placeholder)                           │ │
│  │ - Gurobi (placeholder)                             │ │
│  │ - CPLEX (placeholder)                              │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Solver Support

| Solver | Status | License | Implementation |
|--------|--------|---------|----------------|
| **HiGHS** | ✅ Implemented | Open Source | Mock solutions |
| **OR-Tools** | 🔄 Placeholder | Open Source | Not implemented |
| **Gurobi** | 🔄 Placeholder | Commercial | Not implemented |
| **CPLEX** | 🔄 Placeholder | Commercial | Not implemented |

### Adding New Solvers

See [Adding New Solvers Guide](docs/architecture/adding-new-solvers.md) for detailed instructions on implementing additional optimization solvers.

## 📁 Project Structure

```
dcisionai-platform/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Next.js pages and API routes
│   │   ├── api/            # API endpoints
│   │   │   ├── solver/     # Solver API routes
│   │   │   └── _lib/       # Shared library code
│   │   │       ├── solvers/ # Solver implementations
│   │   │       └── ...     # Other shared code
│   │   │
│   │   └── workflows/          # Domain-specific workflows
│   │       ├── construction/   # Construction optimization
│   │       ├── retail/         # Retail optimization
│   │       └── finance/        # Finance optimization
│   └── ...
├── docs/                   # Documentation
│   ├── architecture/       # Architecture guides
│   ├── api/               # API documentation
│   └── ...
├── Dockerfile             # Production Docker image
├── cloudbuild.yaml        # Google Cloud Build config
└── ...
```

## 🚀 Deployment

### Google Cloud Run

The platform is deployed as a single service on Google Cloud Run:

```bash
# Deploy to production
gcloud builds submit --config cloudbuild.yaml .

# Service URL: https://platform-dcisionai-<hash>-uc.a.run.app
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SOLVER_URL=https://your-domain.com
SOLVER_API_KEY=your-api-key

# Optional
NODE_ENV=production
```

## 📚 Documentation

- [Architecture Overview](docs/architecture/architecture.md)
- [Adding New Solvers](docs/architecture/adding-new-solvers.md)
- [API Reference](docs/api/README.md)
- [Development Guide](docs/onboarding/DEVELOPMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 