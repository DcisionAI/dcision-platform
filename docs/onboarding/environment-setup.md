# Development Environment Setup

This guide will help you set up your development environment for the DcisionAI platform.

## Prerequisites

### 1. System Requirements

- **Operating System**
  - macOS 10.15+
  - Windows 10+
  - Linux (Ubuntu 20.04+)

- **Hardware**
  - 8GB RAM minimum
  - 20GB free disk space
  - Multi-core processor

### 2. Required Software

- **Node.js**
  - Version 18.x or later
  - npm 9.x or later
  - nvm (recommended)

- **Git**
  - Version 2.30.0 or later
  - GitHub account

- **Database**
  - PostgreSQL 14+
  - Supabase CLI

- **Development Tools**
  - VS Code or similar IDE
  - Docker Desktop
  - Postman or similar API client

## Installation Steps

### 1. Node.js Setup

1. **Install nvm**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Install Node.js**
   ```bash
   nvm install 18
   nvm use 18
   ```

3. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

### 2. Git Setup

1. **Install Git**
   - macOS: `brew install git`
   - Windows: Download from git-scm.com
   - Linux: `sudo apt install git`

2. **Configure Git**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/dcisionai-platform.git
   cd dcisionai-platform
   ```

### 3. Database Setup

1. **Install PostgreSQL**
   - macOS: `brew install postgresql@14`
   - Windows: Download from postgresql.org
   - Linux: `sudo apt install postgresql-14`

2. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

3. **Start PostgreSQL**
   ```bash
   # macOS
   brew services start postgresql@14

   # Linux
   sudo service postgresql start
   ```

### 4. Project Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Migration**
   ```bash
   npm run db:migrate
   ```

4. **Seed Database**
   ```bash
   npm run db:seed
   ```

## Development Tools

### 1. VS Code Extensions

- **Required Extensions**
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - GitLens
  - Docker
  - PostgreSQL

- **Recommended Extensions**
  - Error Lens
  - Git Graph
  - REST Client
  - Tailwind CSS IntelliSense

### 2. Browser Extensions

- **Required Extensions**
  - React Developer Tools
  - Redux DevTools

- **Recommended Extensions**
  - JSON Formatter
  - ColorZilla

## Development Workflow

### 1. Starting Development

1. **Start Frontend**
   ```bash
   npm run dev
   ```

2. **Start Backend**
   ```bash
   npm run server:dev
   ```

3. **Start Database**
   ```bash
   npm run db:start
   ```

### 2. Common Commands

- **Testing**
  ```bash
  npm test        # Run all tests
  npm run test:watch  # Run tests in watch mode
  ```

- **Linting**
  ```bash
  npm run lint    # Run linter
  npm run format  # Format code
  ```

- **Database**
  ```bash
  npm run db:migrate  # Run migrations
  npm run db:seed     # Seed database
  ```

### 3. Debugging

1. **VS Code Debugging**
   - Set breakpoints
   - Use debug console
   - Watch variables
   - Step through code

2. **Browser Debugging**
   - Use DevTools
   - Network tab
   - Console
   - Performance monitoring

## Troubleshooting

### 1. Common Issues

- **Node.js Issues**
  ```bash
  # Clear npm cache
  npm cache clean --force

  # Reinstall dependencies
  rm -rf node_modules
  npm install
  ```

- **Database Issues**
  ```bash
  # Reset database
  npm run db:reset

  # Check database status
  npm run db:status
  ```

- **Build Issues**
  ```bash
  # Clear build cache
  npm run clean

  # Rebuild
  npm run build
  ```

### 2. Getting Help

- Check documentation
- Search issues
- Ask in Slack
- Contact team lead

## Related Documents

- [Codebase Overview](./codebase-overview.md)
- [Technology Stack](./technology-stack.md)
- [Adding New Features](./adding-features.md) 