locals {
  preview_access_enabled = var.environment == "preview" && var.preview_hostname != "" && length(var.preview_allowed_emails) > 0
}

# 専用hostname全体を保護し、許可したメールアドレスだけにログインを認める。
resource "cloudflare_zero_trust_access_application" "preview" {
  count      = local.preview_access_enabled ? 1 : 0
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-preview"
  type       = "self_hosted"
  domain     = var.preview_hostname

  # 稼働中のWorkerを公開状態に戻さないため、gateの削除・hostname変更は別作業にする。
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [domain]
  }

  options_preflight_bypass   = false
  http_only_cookie_attribute = true
  session_duration           = "24h"
  policies = [{
    name       = "preview-reviewers"
    decision   = "allow"
    precedence = 1
    include = [for email in var.preview_allowed_emails : {
      email = { email = email }
    }]
  }]
}
