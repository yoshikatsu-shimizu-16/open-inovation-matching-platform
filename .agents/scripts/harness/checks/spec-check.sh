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
  grep -qE '^\s*-\s*\[x\]\s*レビュー済み' "$req" && req_reviewed=1
  [[ -f "$design" ]] && grep -qE '^\s*-\s*\[x\]\s*レビュー済み' "$design" && design_reviewed=1
  [[ -f "$tasks" ]] && grep -qE '^\s*-\s*\[x\]\s*レビュー済み' "$tasks" && tasks_reviewed=1

  if [[ -f "$design" && $req_reviewed -eq 0 ]]; then
    echo "ERROR: [$feature] design.md exists before requirements.md is marked reviewed"
    status=1
  fi

  if [[ -f "$tasks" && ! -f "$design" ]]; then
    echo "ERROR: [$feature] tasks.md exists without design.md"
    status=1
  elif [[ -f "$tasks" && $design_reviewed -eq 0 ]]; then
    echo "ERROR: [$feature] tasks.md exists before design.md is marked reviewed"
    status=1
  fi

  if [[ "$mode" == "--complete" ]]; then
    for f in "$req" "$design" "$tasks"; do
      if [[ ! -f "$f" ]]; then
        echo "ERROR: [$feature] missing $f"
        status=1
      elif ! grep -qE '^\s*-\s*\[x\]\s*レビュー済み' "$f"; then
        echo "ERROR: [$feature] $(basename "$f") is not marked reviewed (## Review checkbox unchecked)"
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
