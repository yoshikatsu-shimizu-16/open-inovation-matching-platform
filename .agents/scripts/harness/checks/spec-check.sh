#!/usr/bin/env bash
set -euo pipefail

# Mechanical pre-check for the sdd-analyze skill
# (.agents/skills/sdd-analyze/SKILL.md, mirrored at .claude/skills/sdd-analyze/SKILL.md).
# Stage mode validates the artifacts created so far and enforces review order.
# Complete mode additionally catches missing or unreviewed documents, missing
# requirement<->task traceability, and missing task verification fields before
# sdd-analyze proceeds.
# It does not judge semantic correctness (constitution violations, terminology
# drift) — that remains the analyze skill's job.

specs_dir="docs/specs"

if [[ ! -d "$specs_dir" ]]; then
  echo "[spec-check] $specs_dir not found, skipping"
  exit 0
fi

status=0
found_feature=0
mode="${1:---stage}"

if [[ "$mode" != "--stage" && "$mode" != "--complete" ]]; then
  echo "ERROR: unknown spec-check mode: $mode" >&2
  echo "usage: $0 [--stage|--complete]" >&2
  exit 64
fi

# ## Review セクションだけを取り出す。本文や例示に同じmetadata文字列があっても
# レビュー済みと誤判定しないため、すべてのReview判定はこの範囲に限定する。
review_section() {
  local file="$1"
  awk '
    /^## Review[[:space:]]*$/ { in_review = 1; next }
    in_review && /^##[[:space:]]/ { exit }
    in_review { print }
  ' "$file"
}

# 新しい成果物はReview metadataを使う。既存forkの移行互換性のため、
# 旧 `- [x] レビュー済み` もReviewセクション内に限って読み取りを許容する。
is_reviewed_file() {
  local file="$1"
  local section
  section="$(review_section "$file")"

  if printf '%s\n' "$section" | grep -qE '^\s*-\s*Status:\s*reviewed\s*$' \
    && printf '%s\n' "$section" | grep -qE '^\s*-\s*Evidence:\s*PR #[0-9]+\s*$' \
    && printf '%s\n' "$section" | grep -qE '^\s*-\s*Reviewed at:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}T[^[:space:]]+\s*$' \
    && printf '%s\n' "$section" | grep -qE '^\s*-\s*Reviewed by:\s*@[^[:space:]]+\s*$'; then
    return 0
  fi
  printf '%s\n' "$section" | grep -qE '^\s*-\s*\[x\]\s*レビュー済み'
}

# スターター由来の既存2件は、全体要件導入前にレビューされた移行例外。
# 新しいアプリ機能SPECが1件でも存在する場合は、全体要件とconstitutionを必須にする。
active_features=()
for feature_dir in "$specs_dir"/*/; do
  [[ -d "$feature_dir" ]] || continue
  feature="$(basename "$feature_dir")"
  case "$feature" in
    hono-backend-boilerplate|cloudflare-runtime) ;;
    *) active_features+=("$feature") ;;
  esac
done

if ! node - "$mode" "${active_features[@]}" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [mode, ...features] = process.argv.slice(2);
const projectPath = "docs/project-requirements.md";
const constitutionPath = "docs/constitution.md";
const errors = [];
const exists = fs.existsSync(projectPath);
const project = exists ? fs.readFileSync(projectPath, "utf8") : "";
const constitution = fs.readFileSync(constitutionPath, "utf8");

const reviewSection = (source) => source.split(/^## Review\s*$/m)[1]?.split(/^## /m)[0] ?? "";
const reviewMetadata = (source) => {
  const section = reviewSection(source);
  const field = (name) => new RegExp(`^\\s*-\\s*${name}:\\s*(.*?)\\s*$`, "mi").exec(section)?.[1]?.trim();
  return {
    status: field("Status")?.toLowerCase(),
    evidence: field("Evidence"),
    reviewedAt: field("Reviewed at"),
    reviewedBy: field("Reviewed by"),
  };
};
const legacyReviewed = (source) => /^\s*-\s*\[x\]\s*レビュー済み/m.test(reviewSection(source));
const reviewed = (source) => reviewMetadata(source).status === "reviewed" || legacyReviewed(source);
const validReviewEvidence = (source) => {
  const metadata = reviewMetadata(source);
  if (metadata.status !== "reviewed") return legacyReviewed(source);
  return (
    /^PR #\d+$/.test(metadata.evidence ?? "") &&
    /^\d{4}-\d{2}-\d{2}T\S+$/.test(metadata.reviewedAt ?? "") &&
    /^@\S+$/.test(metadata.reviewedBy ?? "")
  );
};
const unfinished = (source) =>
  /ここにプロジェクト固有|\(例:|\*\*singleton \/ template\*\*|記入例（採用する場合|<project>|<未記入>|<解決する課題|<主要業務フロー|<利用者に提供|<品質・安全|<段階>|<ID>|<理由と影響>|<確認者または未レビュー>|<全体要件のレビュー後/.test(source);
const normalizeSpecSlug = (value) => value.trim().replace(/^`([^`]+)`$/, "$1");
const rows = new Map();

if (features.length && !exists) errors.push(`missing ${projectPath} before application feature specs`);
if (exists) {
  const lines = project.split("\n").filter((line) => /^\|\s*(?:FR|NFR)-\d{3,}\s*\|/.test(line));
  for (const line of lines) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const [id, requirement, status, phase, spec, completed, evidence] = cells;
    if (rows.has(id)) errors.push(`duplicate requirement ID ${id}`);
    rows.set(id, { requirement, status, phase, spec, completed, evidence });
    if (!["予定", "仕様化中", "実装中", "検証済み", "取り下げ"].includes(status)) errors.push(`invalid status for ${id}`);
    if (status === "検証済み" && (!/^\d{4}-\d{2}-\d{2}$/.test(completed ?? "") || !evidence || evidence === "—")) {
      errors.push(`verified ${id} needs completion date and evidence`);
    }
    if (spec && spec !== "—") {
      for (const slug of spec.split(",").map(normalizeSpecSlug)) {
        if (!fs.existsSync(path.join("docs/specs", slug, "requirements.md"))) errors.push(`${id} refers to missing spec ${slug}`);
      }
    }
  }
  for (const prefix of ["FR", "NFR"]) {
    const numbers = [...rows.keys()].filter((id) => id.startsWith(`${prefix}-`)).map((id) => Number(id.split("-")[1])).sort((a, b) => a - b);
    numbers.forEach((number, index) => {
      if (number !== index + 1) errors.push(`gap in ${prefix} IDs: retain withdrawn rows instead of reusing/deleting IDs`);
    });
  }
  if (reviewed(project)) {
    if (!validReviewEvidence(project)) errors.push("reviewed project requirements need valid Review evidence metadata");
    if (!rows.size || ![...rows.keys()].some((id) => id.startsWith("FR-")) || ![...rows.keys()].some((id) => id.startsWith("NFR-"))) errors.push("reviewed project requirements need FR and NFR rows");
    if (unfinished(project)) errors.push("reviewed project requirements still contain template placeholders");
  }
}
if (reviewed(constitution) && !validReviewEvidence(constitution)) errors.push("reviewed constitution needs valid Review evidence metadata");
if (reviewed(constitution) && !reviewed(project)) errors.push("constitution cannot be reviewed before project requirements");
if (reviewed(constitution) && unfinished(constitution)) errors.push("reviewed constitution still contain template placeholders");

if (features.length) {
  if (!reviewed(project)) errors.push("project requirements must be human-reviewed before feature specs");
  if (!reviewed(constitution)) errors.push("constitution must be human-reviewed before feature specs");
  if (unfinished(constitution)) errors.push("constitution still contains template placeholders");
}
for (const feature of features) {
  const reqPath = path.join("docs/specs", feature, "requirements.md");
  if (!fs.existsSync(reqPath)) continue;
  const req = fs.readFileSync(reqPath, "utf8");
  const section = req.split(/^## Parent requirements\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const refs = [...new Set(section.match(/\b(?:FR|NFR)-\d{3,}\b/g) ?? [])];
  if (!refs.length) errors.push(`[${feature}] missing Parent requirements FR/NFR references`);
  for (const id of refs) {
    const row = rows.get(id);
    if (!row) errors.push(`[${feature}] unknown parent ${id}`);
    else if (row.status === "取り下げ") errors.push(`[${feature}] withdrawn parent ${id}`);
    else if (!(row.spec ?? "").split(",").map(normalizeSpecSlug).includes(feature)) errors.push(`[${feature}] ${id} register does not refer back to this spec`);
  }
}
for (const error of errors) console.error(`ERROR: [project-spec] ${error}`);
process.exit(errors.length ? 1 : 0);
NODE
then
  status=1
fi

for feature_dir in "$specs_dir"/*/; do
  [[ -d "$feature_dir" ]] || continue
  found_feature=1
  feature="$(basename "$feature_dir")"

  req="${feature_dir}requirements.md"
  design="${feature_dir}design.md"
  tasks="${feature_dir}tasks.md"

  if [[ ! -f "$req" ]]; then
    echo "ERROR: [$feature] missing $req"
    status=1
    continue
  fi

  req_ids=$(grep -oE 'REQ-[0-9]+' "$req" | sort -u || true)
  if [[ -z "$req_ids" ]]; then
    echo "ERROR: [$feature] requirements.md has no stable requirement IDs (REQ-NNN)"
    status=1
  fi

  req_reviewed=0
  design_reviewed=0
  tasks_reviewed=0
  is_reviewed_file "$req" && req_reviewed=1
  [[ -f "$design" ]] && is_reviewed_file "$design" && design_reviewed=1
  [[ -f "$tasks" ]] && is_reviewed_file "$tasks" && tasks_reviewed=1

  if [[ -f "$design" && $req_reviewed -eq 0 ]]; then
    echo "ERROR: [$feature] design.md exists before requirements.md is reviewed"
    status=1
  fi

  if [[ -f "$tasks" && ! -f "$design" ]]; then
    echo "ERROR: [$feature] tasks.md exists without design.md"
    status=1
  elif [[ -f "$tasks" && $design_reviewed -eq 0 ]]; then
    echo "ERROR: [$feature] tasks.md exists before design.md is reviewed"
    status=1
  fi

  if [[ "$mode" == "--complete" ]]; then
    for f in "$req" "$design" "$tasks"; do
      if [[ ! -f "$f" ]]; then
        echo "ERROR: [$feature] missing $f"
        status=1
      elif ! is_reviewed_file "$f"; then
        echo "ERROR: [$feature] $(basename "$f") is not reviewed (Review metadata is incomplete or pending)"
        status=1
      fi
    done
  fi

  [[ -f "$tasks" ]] || continue

  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    if ! grep -q "verifies:.*${id}\\b" "$tasks"; then
      echo "ERROR: [$feature] $id has no task in tasks.md verifying it"
      status=1
    fi
  done <<< "$req_ids"

  task_lines=$(grep -E '^\s*-\s*\[.\]\s*T[0-9]+' "$tasks" || true)
  if [[ -z "$task_lines" ]]; then
    echo "ERROR: [$feature] tasks.md has no task entries"
    status=1
  else
    while IFS= read -r line; do
      if ! echo "$line" | grep -qE 'checks:\s*\S'; then
        echo "ERROR: [$feature] task line missing 'checks:' field: ${line#*- }"
        status=1
      fi
    done <<< "$task_lines"
  fi
done

if [[ $found_feature -eq 0 ]]; then
  echo "[spec-check] no feature directories under $specs_dir, skipping"
  exit 0
fi

if [[ $status -eq 0 ]]; then
  echo "Spec-check PASS"
fi

exit $status
