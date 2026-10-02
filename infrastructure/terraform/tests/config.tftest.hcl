mock_provider "cloudflare" {}

run "preview_resource_names" {
  command = plan

  variables {
    cloudflare_account_id = "00000000000000000000000000000000"
    project_name          = "sample-app"
    environment           = "preview"
  }

  assert {
    condition     = cloudflare_d1_database.tasks.name == "sample-app-preview-tasks"
    error_message = "D1 name must include the preview environment."
  }

  assert {
    condition     = cloudflare_r2_bucket.assets.name == "sample-app-preview-assets"
    error_message = "R2 name must include the preview environment."
  }
  assert {
    condition     = length(cloudflare_zero_trust_access_application.preview) == 0 && output.preview_hostname == "" && output.preview_access_application_id == ""
    error_message = "前提が未設定のpreviewにはAccessや公開hostnameを作らない。"
  }
}

run "preview_access_allowlist" {
  command = plan
  variables {
    cloudflare_account_id  = "00000000000000000000000000000000"
    project_name           = "sample-app"
    environment            = "preview"
    preview_hostname       = "preview.example.com"
    preview_allowed_emails = ["reviewer@example.com"]
  }
  assert {
    condition     = cloudflare_zero_trust_access_application.preview[0].domain == "preview.example.com" && cloudflare_zero_trust_access_application.preview[0].type == "self_hosted"
    error_message = "preview hostname全体をAccessで保護する。"
  }
  assert {
    condition     = cloudflare_zero_trust_access_application.preview[0].policies[0].decision == "allow" && cloudflare_zero_trust_access_application.preview[0].options_preflight_bypass == false
    error_message = "allowlistを適用し、preflightも保護する。"
  }
  assert {
    condition     = one(cloudflare_zero_trust_access_application.preview[0].policies[0].include).email.email == "reviewer@example.com"
    error_message = "指定したメールアドレスだけを許可する。"
  }
}

run "preview_rejects_empty_allowlist" {
  command = plan
  variables {
    cloudflare_account_id = "00000000000000000000000000000000"
    environment           = "preview"
    preview_hostname      = "preview.example.com"
  }
  expect_failures = [var.preview_hostname]
}

run "production_resource_names" {
  command = plan

  variables {
    cloudflare_account_id = "00000000000000000000000000000000"
    project_name          = "sample-app"
    environment           = "production"
  }

  assert {
    condition     = output.environment == "production"
    error_message = "Output must identify the production state."
  }
}
