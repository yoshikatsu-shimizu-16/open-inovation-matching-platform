output "d1_database_id" {
  description = "D1 database id to set as database_id in backend/wrangler.jsonc for remote environments."
  value       = cloudflare_d1_database.tasks.id
}

output "d1_database_name" {
  description = "D1 database name used by the Worker binding."
  value       = cloudflare_d1_database.tasks.name
}

output "r2_bucket_name" {
  description = "R2 bucket name used by the Worker binding."
  value       = cloudflare_r2_bucket.assets.name
}

output "environment" {
  description = "Environment represented by this Terraform state."
  value       = var.environment
}

output "preview_hostname" {
  description = "Accessで保護したpreviewのhostname。未設定なら空文字。"
  value       = try(cloudflare_zero_trust_access_application.preview[0].domain, "")

  precondition {
    condition     = try(cloudflare_zero_trust_access_application.preview[0].domain == var.preview_hostname, !local.preview_access_enabled)
    error_message = "稼働中previewのhostname変更は、既存Workerの公開経路を閉じる別作業として実施する。"
  }
}

output "preview_access_application_id" {
  description = "適用済みpreview Access applicationの識別子。未設定なら空文字。"
  value       = try(cloudflare_zero_trust_access_application.preview[0].id, "")
}
