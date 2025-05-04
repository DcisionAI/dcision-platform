// Outputs for domain mappings
output "domain_mappings" {
  description = "Cloud Run domain mapping names"
  value = {
    frontend = google_cloud_run_domain_mapping.frontend.name
    solver   = google_cloud_run_domain_mapping.solver.name
    data     = google_cloud_run_domain_mapping.data.name
    plugin   = google_cloud_run_domain_mapping.plugin.name
  }
}