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

// Domain mapping for the solver service
resource "google_cloud_run_domain_mapping" "solver" {
  location = var.region
  name     = "solve.dcisionai.com"

  metadata {
    namespace = var.project
  }

  spec {
    # Note: the actual service name deployed is "solver-service"
    route_name = "solver-service"
  }
}

// Domain mapping for the data (Airbyte) service
resource "google_cloud_run_domain_mapping" "data" {
  location = var.region
  name     = "data.dcisionai.com"

  metadata {
    namespace = var.project
  }

  spec {
    route_name = "data"
  }
}

// Domain mapping for the plugin service
resource "google_cloud_run_domain_mapping" "plugin" {
  location = var.region
  name     = "plugin.dcisionai.com"

  metadata {
    namespace = var.project
  }

  spec {
    # The Cloud Run service is named "plugin-service"
    route_name = "plugin-service"
  }
}