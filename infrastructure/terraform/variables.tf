variable "cloudflare_account_id" {
  description = "Cloudflare account identifier for the forked application."
  type        = string
}

variable "project_name" {
  description = "Stable kebab-case prefix used for Cloudflare resource names."
  type        = string
  default     = "dev-standard-kit"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*$", var.project_name))
    error_message = "project_name must be a lowercase kebab-case identifier."
  }
}

variable "environment" {
  description = "Remote environment whose resources are managed by this state."
  type        = string

  validation {
    condition     = contains(["preview", "production"], var.environment)
    error_message = "environment must be preview or production."
  }
}

variable "preview_hostname" {
  description = "Cloudflare管理下のpreview専用hostname。未設定ならpreviewを公開しない。"
  type        = string
  default     = ""

  validation {
    condition     = var.preview_hostname == "" || (can(regex("^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$", var.preview_hostname)) && !endswith(var.preview_hostname, ".workers.dev"))
    error_message = "preview_hostnameにはパスやwildcardを含まない専用のcustom domainを指定する。"
  }

  validation {
    condition     = var.preview_hostname == "" || length(var.preview_allowed_emails) > 0
    error_message = "previewを公開するには許可するメールアドレスの指定が必要。"
  }
}

variable "preview_allowed_emails" {
  description = "previewにアクセスできる利用者のメールアドレス。"
  type        = set(string)
  default     = []

  validation {
    condition     = alltrue([for email in var.preview_allowed_emails : can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", email))])
    error_message = "preview_allowed_emailsには有効なメールアドレスを指定する。"
  }
}
