# DcisionAI Platform

An AgenticAI platform for AI-powered decision making and optimization.  
Deployable on any cloud, on-premises, or local infrastructure using Docker and Terraform.

---

## 🚀 What is DcisionAI?

DcisionAI is a modular, open platform for building, deploying, and managing AI-driven decision and optimization workflows.  
- **Cloud-agnostic:** Deploy anywhere—AWS, GCP, Azure, DigitalOcean, or your own servers.
- **Open standards:** Uses Docker and Terraform for easy, reproducible deployments.
- **Flexible:** Bring your own database, authentication, and infrastructure.
- **AI-Powered Optimization:** GPT-4o-mini powered model builder for dynamic optimization problem generation.

---

## 🤖 AI-Powered Model Builder

DcisionAI features an advanced AI-powered model builder that automatically generates optimization models from natural language descriptions:

### GPT-4o-mini Integration
- **Performance**: 2x faster than GPT-4o for model generation
- **Cost**: 60x cheaper than GPT-4o while maintaining excellent mathematical reasoning
- **Reliability**: Excellent JSON generation for optimization model structures
- **Rate Limits**: Higher rate limits for better throughput

### Multi-Strategy Approach
The Enhanced Model Builder uses a three-tier strategy:
1. **Dynamic AI Generation**: Uses GPT-4o-mini to generate models from user input and enriched data
2. **Template-Based Fallback**: Falls back to pre-built optimization templates when AI generation fails
3. **AI-Generated Fallback**: Creates simple but valid models using AI when templates aren't suitable

### Example Usage
```bash
curl -X POST http://localhost:3001/api/dcisionai/construction/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Optimize crew assignments for our 3-story office building project. We have 15 workers available: 5 carpenters, 5 electricians, 3 plumbers, and 2 HVAC technicians. The project has 4 phases: foundation (2 weeks), framing (3 weeks), MEP installation (4 weeks), and finishing (2 weeks). Minimize project duration while ensuring safety and quality standards.",
    "useOrchestration": true,
    "sessionId": "test-session-1"
  }'
```

### Configuration
Easily switch between different AI models using environment variables:
```bash
# Use GPT-4o-mini (default)
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
USE_GPT4O_MINI=true

# Or use full GPT-4o for complex problems
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
USE_GPT4O_MINI=false
```

---

## 🏠 On-Premises / Local Deployment

1. **Clone the repository:**
   ```sh
   git clone https://github.com/DcisionAI/dcision-platform.git
   cd dcision-platform
   ```

2. **Copy and configure environment variables:**
   ```sh
   cp config.example.env .env
   ```
   Edit `.env` to set your database, Supabase, and other secrets.

3. **Start the platform:**
   ```sh
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Access the platform:**  
   Open your browser to `http://localhost:3000` (or your server's IP/domain).

---

## ☁️ Cloud Deployment (Terraform)

DcisionAI provides a cloud-agnostic Terraform module for automated deployment.  
**Terraform code is located in [`/terraform`](https://github.com/DcisionAI/dcision-platform/tree/main/terraform).**

### Steps:

1. **Configure your infrastructure variables:**  
   Edit `terraform/variables.tf` and/or create a `terraform.tfvars` file with your settings (Postgres host, Docker host, etc).

2. **Initialize and apply Terraform:**
   ```sh
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```
   This will provision infrastructure and deploy DcisionAI using Docker.

3. **Access the platform:**  
   The output will provide the URL or IP address for your deployment.

---

## 🛠️ Requirements

- Docker and Docker Compose
- [Terraform](https://www.terraform.io/downloads.html)
- A PostgreSQL database (self-hosted, managed, or cloud)
- (Optional) Supabase project for authentication and storage

---

## 📦 Updating

To update, simply pull the latest image and restart:
```sh
docker pull ghcr.io/dcisionai/dcision-platform:latest
docker compose -f docker-compose.prod.yml up -d
```

---

## 📚 Documentation

- [Terraform deployment code](https://github.com/DcisionAI/dcision-platform/tree/main/terraform)
- [Full documentation](https://github.com/DcisionAI/dcision-platform)

---

## 🆘 Support

For help, open an issue on [GitHub Issues](https://github.com/DcisionAI/dcision-platform/issues).

# DcisionAI Documentation

Welcome to the DcisionAI platform documentation. This guide will help you understand the architecture, APIs, and development workflows.

## 📚 Documentation Structure

### Architecture & Design

- **[Architecture Overview](architecture/architecture.md)** - System architecture and component overview
- **[MCP Overview](architecture/mcp-overview.md)** - Model Context Protocol framework and implementation
- **[Solver Status](architecture/solver-status.md)** - Current implementation status of optimization solvers
- **[Adding New Solvers](architecture/adding-new-solvers.md)** - Comprehensive guide for implementing new solvers
- **[HiGHS Integration](architecture/HIGHS_MCP_INTEGRATION_GUIDE.md)** - HiGHS solver integration details

### API Documentation

- **[API Reference](api/README.md)** - Complete API documentation
- **[Authentication](api/authentication.md)** - API key authentication
- **[Rate Limiting](api/rate-limiting.md)** - Rate limiting policies
- **[Webhooks](api/webhooks.md)** - Webhook integration
- **[SDK](api/sdk.md)** - Client SDK documentation

### Development

- **[Development Guide](onboarding/DEVELOPMENT.md)** - Local development setup
- **[Environment Setup](onboarding/environment-setup.md)** - Environment configuration
- **[Codebase Overview](onboarding/codebase-overview.md)** - Project structure and organization
- **[Contributing Guidelines](onboarding/CONTRIBUTING.md)** - How to contribute to the project

### Deployment

- **[Cloud Run Deployment](deployment/CLOUD_RUN_DEPLOYMENT_GUIDE.md)** - Google Cloud Run deployment
- **[Single Service Deployment](SINGLE_SERVICE_DEPLOYMENT_GUIDE.md)** - Single-service deployment guide

### Platform Features

- **[Platform Overview](platform/platform-overview.md)** - Platform features and capabilities
- **[Agents System](platform/dcisionai-agents.md)** - AI agent architecture
- **[Mathematical Optimization](platform/mathematical-optimization.md)** - Optimization capabilities
- **[Persistence Layer](platform/persistencelayer.md)** - Data persistence and storage

## 🚀 Quick Start

1. **Setup Development Environment**: [Environment Setup](onboarding/environment-setup.md)
2. **Understand Architecture**: [Architecture Overview](architecture/architecture.md)
3. **Explore APIs**: [API Reference](api/README.md)
4. **Deploy to Production**: [Cloud Run Deployment](deployment/CLOUD_RUN_DEPLOYMENT_GUIDE.md)

## 🔧 Solver System

The DcisionAI platform includes a comprehensive optimization solver system:

- **Current Status**: [Solver Status](architecture/solver-status.md)
- **Adding New Solvers**: [Implementation Guide](architecture/adding-new-solvers.md)
- **HiGHS Integration**: [Integration Details](architecture/HIGHS_MCP_INTEGRATION_GUIDE.md)

### Supported Solvers

| Solver | Status | License | Use Case |
|--------|--------|---------|----------|
| **HiGHS** | ✅ Implemented | Open Source | Linear and mixed-integer programming |
| **OR-Tools** | 🔄 Placeholder | Open Source | Constraint programming, routing |
| **Gurobi** | 🔄 Placeholder | Commercial | High-performance optimization |
| **CPLEX** | 🔄 Placeholder | Commercial | Enterprise optimization |

## 📖 Additional Resources

- **[Technology Stack](onboarding/technology-stack.md)** - Technologies and frameworks used
- **[Examples](onboarding/examples/)** - Code examples and tutorials
- **[Migration Guides](mcp/migration.md)** - Migration from legacy systems
- **[Testing Guide](setup-testing.md)** - Testing strategies and setup

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](onboarding/CONTRIBUTING.md) for details on how to:

- Report bugs and request features
- Submit code changes
- Improve documentation
- Add new solvers and capabilities

## 📞 Support

For questions and support:

1. Check the documentation above
2. Review [FAQ](FAQ.md) for common questions
3. Open an issue on GitHub for bugs
4. Contact the development team for enterprise support
