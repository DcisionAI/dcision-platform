terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project
  region  = var.region
}

// Domain mapping for the Next.js frontend
resource "google_cloud_run_domain_mapping" "frontend" {
  location = var.region
  name     = "platform.dcisionai.com"

  metadata {
    namespace = var.project
  }

  spec {
    route_name = "frontend"
  }
}