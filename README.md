
## DcisionAI Platform – Deployment Guide

Welcome to the DcisionAI Platform!  
This guide will help you deploy the platform in your own cloud or on-premise environment using Docker.  
**No vendor lock-in. No cloud-specific dependencies.**

---

### 🚀 Quick Start (Docker Compose)

1. **Clone the repository:**
   ```sh
   git clone https://github.com/DcisionAI/dcision-platform.git
   cd dcision-platform
   ```

2. **Copy and edit the environment file:**
   ```sh
   cp config.example.env .env
   ```
   Edit `.env` to set your database, Supabase, and other secrets.

3. **Start the platform:**
   ```sh
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Access the platform:**
   - Open your browser and go to `http://localhost:3000` (or your server’s IP/domain).

---

### 🛠️ Requirements

- Docker and Docker Compose installed
- A PostgreSQL database (self-hosted, managed, or cloud)
- (Optional) Supabase project for authentication and storage

---

### ⚙️ Configuration

- All configuration is handled via environment variables in the `.env` file.
- No hardcoded cloud provider dependencies.
- You can use any Postgres-compatible database (AWS RDS, GCP Cloud SQL, Azure, DigitalOcean, self-hosted, etc).

---

### 🏗️ Advanced: Custom Deployments

- You can use the published Docker image:  
  ```
  ghcr.io/dcisionai/dcision-platform:latest
  ```
- Integrate with your own CI/CD, Kubernetes, or Terraform as needed.

---

### 📦 Updating

To update, simply pull the latest image and restart:
```sh
docker pull ghcr.io/dcisionai/dcision-platform:latest
docker compose -f docker-compose.prod.yml up -d
```

---

### 📚 Documentation

- [Full documentation](https://github.com/DcisionAI/dcision-platform)
- [Deployment examples](docs/docker-deploy.md) (if you have this file)

---

### 🆘 Support

For help, open an issue on [GitHub Issues](https://github.com/DcisionAI/dcision-platform/issues).
