# DcisionAI Platform - Docker Deployment Guide

Welcome to the DcisionAI Platform! This guide will help you deploy the platform using Docker and Docker Compose, leveraging our pre-built image from GitHub Container Registry.

---

## Prerequisites

- **Docker** (v20+ recommended): [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2+ recommended): [Install Docker Compose](https://docs.docker.com/compose/install/)
- Access to your own **Postgres** database (cloud or self-hosted)
  - Supported providers include AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL, Supabase, and others.
- Your Supabase project credentials (for platform features)
- Your DcisionAI API key (provided by your platform administrator)

---

## 1. Pull the Latest Image

```bash
docker pull ghcr.io/dcisionai/dcision-platform:latest
```

---

## 2. Prepare Your Environment Variables

Create a `.env` file in your deployment directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=5432
POSTGRES_DB=your_postgres_db
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
```

- **Do not commit your `.env` file to version control.**
- Make sure your Postgres database is accessible from the machine/container running the app.
- You can use any managed or self-hosted Postgres database (AWS RDS, GCP Cloud SQL, Azure, Supabase, etc.).

---

## 3. Use the Provided Docker Compose File

Create a file named `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  app:
    image: ghcr.io/dcisionai/dcision-platform:latest
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

---

## 4. Start the Platform

```bash
docker-compose -f docker-compose.prod.yml up -d
```

- The app will be available at [http://localhost:3000](http://localhost:3000) (or your server's IP/domain).

---

## 5. Onboarding Flow

- On first launch, you will be prompted for your DcisionAI API key.
- Enter the key provided by your platform administrator.
- You will be redirected to the dashboard after successful onboarding.

---

## 6. Updating the Platform

To update to the latest version:

```bash
docker pull ghcr.io/dcisionai/dcision-platform:latest
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 7. Troubleshooting

- **App not starting?**
  - Check your `.env` file for typos or missing variables.
  - Ensure your Postgres database is running and accessible.
  - Run `docker-compose logs app` for error messages.
- **Port already in use?**
  - Change the `ports` mapping in `docker-compose.prod.yml` (e.g., `- "8080:3000"`).
- **Database connection issues?**
  - Make sure your Postgres host, user, and password are correct.
  - Ensure your firewall/security group allows connections from the app.

---

## 8. Support

- For help, contact [support@dcisionai.com](mailto:support@dcisionai.com) or open an issue on [GitHub](https://github.com/DcisionAI/dcision-platform).

---

## 9. Advanced: Customizing the Deployment

- You can add more services (e.g., a reverse proxy, monitoring) to your `docker-compose.prod.yml` as needed.
- For cloud or Kubernetes deployments, see our [Terraform guide](../README.md#aws-deployment-terraform).

---

**Thank you for choosing DcisionAI!** 