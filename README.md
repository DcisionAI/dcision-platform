
# DcisionAI Platform

An AgenticAI platform for AI-powered decision making and optimization.  
Deployable on any cloud, on-premises, or local infrastructure using Docker and Terraform.

---

## 🚀 What is DcisionAI?

DcisionAI is a modular, open platform for building, deploying, and managing AI-driven decision and optimization workflows.  
- **Cloud-agnostic:** Deploy anywhere—AWS, GCP, Azure, DigitalOcean, or your own servers.
- **Open standards:** Uses Docker and Terraform for easy, reproducible deployments.
- **Flexible:** Bring your own database, authentication, and infrastructure.

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
   Open your browser to `http://localhost:3000` (or your server’s IP/domain).

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
