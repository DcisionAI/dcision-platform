// Outputs for domain mappings
output "domain_mappings" {
  description = "Cloud Run domain mapping names"
  value = {
    frontend = google_cloud_run_domain_mapping.frontend.name
  }
}