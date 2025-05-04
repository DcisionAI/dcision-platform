// Variables for Terraform configuration
variable "project" {
  description = "GCP project ID"
  type        = string
}


variable "region" {
  description = "GCP region for Cloud Run services"
  type        = string
  default     = "us-central1"
}