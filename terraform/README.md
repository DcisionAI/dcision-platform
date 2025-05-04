# Terraform for Cloud Run Domain Mappings

This directory contains Terraform configuration to manage the Cloud Run domain mappings for the DcisionAI platform.

## Prerequisites
- Terraform v1.5.0 or later
- `gcloud` CLI configured with the target project
- Permissions: roles/run.admin, roles/iam.serviceAccountUser, roles/secretmanager.secretAccessor

## Usage
1. Initialize Terraform:
   ```bash
   cd terraform
   # Use the bundled Terraform binary
   ./bin/terraform init
   ```

2. Populate variables:
   - Create a `terraform.tfvars` file alongside the config (or set environment variables):
     ```hcl
     project = "YOUR_GCP_PROJECT_ID"
     region  = "us-central1"
     ```

3. Authenticate to GCP using your user credentials:
   ```bash
   # If you previously set GOOGLE_APPLICATION_CREDENTIALS, unset it to avoid loading a bad key
   unset GOOGLE_APPLICATION_CREDENTIALS
   gcloud auth application-default login
   ```
   Terraform will then use your gcloud Application Default Credentials.

4. Add the local Terraform binary to your PATH:
   ```bash
   # From inside terraform/ directory
   export PATH="$PWD/bin:$PATH"
   ```

5. Import existing domain mappings (full resource IDs):
   ```bash
   PROJECT=$(gcloud config get-value project)
   REGION=${region}
   ./bin/terraform import google_cloud_run_domain_mapping.frontend  projects/${PROJECT}/locations/${REGION}/namespaces/${PROJECT}/domainmappings/platform.dcisionai.com
   ./bin/terraform import google_cloud_run_domain_mapping.solver    projects/${PROJECT}/locations/${REGION}/namespaces/${PROJECT}/domainmappings/solve.dcisionai.com
   ./bin/terraform import google_cloud_run_domain_mapping.data      projects/${PROJECT}/locations/${REGION}/namespaces/${PROJECT}/domainmappings/data.dcisionai.com
   # If you already have a domain mapping for the plugin service, import it; otherwise skip this step
   # ./bin/terraform import google_cloud_run_domain_mapping.plugin    projects/${PROJECT}/locations/${REGION}/namespaces/${PROJECT}/domainmappings/plugin.dcisionai.com
   ```

6. Review and apply:
   ```bash
   # Ensure terraform is the local binary
   terraform plan
   terraform apply -auto-approve
   ```

This will bring your domain mappings under Terraform management, ensuring reproducible infrastructure.