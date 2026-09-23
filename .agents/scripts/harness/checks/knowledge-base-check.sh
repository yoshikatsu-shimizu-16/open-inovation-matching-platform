#!/usr/bin/env bash
set -euo pipefail

HARNESS_DIR=".agents/scripts/harness"
CHECKS_DIR="$HARNESS_DIR/checks"

required=(
  "AGENTS.md"
  "ARCHITECTURE.md"
  "WORKFLOW.md"
  ".agents/README.md"
  ".agents/harness-engineering/reference-implementation-mapping.md"
  ".agents/harness-engineering/agent-hook-enforcement.md"
  ".agents/loop-engineering/README.md"
  ".agents/sdd/README.md"
  ".agents/sdd/constitution.md"
  ".agents/standards"
  ".agents/profiles"
  ".agents/templates"
  "$HARNESS_DIR/harness-verify-orchestrator.sh"
  "$CHECKS_DIR/knowledge-base-check.sh"
  "$CHECKS_DIR/spec-check.sh"
  "$HARNESS_DIR/tests/spec-check.test.mjs"
  "$CHECKS_DIR/source-layout-check.mjs"
  "$HARNESS_DIR/setup/bootstrap.sh"
  ".claude/settings.json"
  ".codex/config.toml"
  ".codex/hooks.json"
  "docs/design-docs/index.md"
  "docs/design-docs/core-beliefs.md"
  "docs/exec-plans/README.md"
  "docs/specs/README.md"
  "docs/maintainers/dev-standard-kit-maintenance.md"
)

for file in "${required[@]}"; do
  if [[ ! -e "$file" ]]; then
    echo "ERROR: required knowledge artifact missing: $file"
    exit 1
  fi
done

# Agent内部のengineering assetは .agents/ 配下へ集約し、
# project rootをmethodology置き場ではなくapplication workspaceとして保つ。
for legacy_dir in harness loop-engineering profiles scripts spec-driven-development standards templates examples; do
  if [[ -e "$legacy_dir" ]]; then
    echo "ERROR: legacy top-level agent directory still exists: $legacy_dir"
    exit 1
  fi
done

# starterを一目で理解できるよう、曖昧な短縮名 harness / loop は使わない。
for deprecated_agent_dir in .agents/harness .agents/loop; do
  if [[ -e "$deprecated_agent_dir" ]]; then
    echo "ERROR: deprecated short AI engineering directory exists: $deprecated_agent_dir"
    exit 1
  fi
done

# .agents/scripts/ は用途別directoryだけを置き、平場へscriptを増やさない。
if find .agents/scripts -mindepth 1 -maxdepth 1 -type f -print -quit | grep -q .; then
  echo "ERROR: top-level files are not allowed under .agents/scripts/. Group scripts by purpose."
  find .agents/scripts -mindepth 1 -maxdepth 1 -type f -print
  exit 1
fi

# Harnessの公開入口は harness-verify-orchestrator.sh だけに固定する。
if find "$HARNESS_DIR" -mindepth 1 -maxdepth 1 -type f ! -name 'harness-verify-orchestrator.sh' -print -quit | grep -q .; then
  echo "ERROR: harness root may contain only harness-verify-orchestrator.sh. Move internal scripts into subdirectories."
  find "$HARNESS_DIR" -mindepth 1 -maxdepth 1 -type f ! -name 'harness-verify-orchestrator.sh' -print
  exit 1
fi
if [[ ! -f "$HARNESS_DIR/harness-verify-orchestrator.sh" ]]; then
  echo "ERROR: missing Harness orchestrator: $HARNESS_DIR/harness-verify-orchestrator.sh"
  exit 1
fi
if find "$HARNESS_DIR" -mindepth 1 -maxdepth 1 ! -type f ! -type d -print -quit | grep -q .; then
  echo "ERROR: unexpected non-file/non-directory entry under $HARNESS_DIR"
  find "$HARNESS_DIR" -mindepth 1 -maxdepth 1 ! -type f ! -type d -print
  exit 1
fi
for subdir in "$CHECKS_DIR" "$HARNESS_DIR/setup"; do
  if [[ ! -d "$subdir" ]]; then
    echo "ERROR: required Harness subdirectory missing: $subdir"
    exit 1
  fi
done

expected_checks=(knowledge-base-check.sh source-layout-check.mjs spec-check.sh)
mapfile -t actual_checks < <(find "$CHECKS_DIR" -mindepth 1 -maxdepth 1 -type f -printf '%f\n' | sort)
if [[ "${actual_checks[*]}" != "${expected_checks[*]}" ]]; then
  echo "ERROR: checks/ must contain exactly: ${expected_checks[*]}"
  echo "Actual files: ${actual_checks[*]}"
  exit 1
fi
if find "$CHECKS_DIR" -mindepth 1 -maxdepth 1 ! -type f -print -quit | grep -q .; then
  echo "ERROR: checks/ may contain only its three checker files"
  find "$CHECKS_DIR" -mindepth 1 -maxdepth 1 ! -type f -print
  exit 1
fi
if [[ ! -f "$HARNESS_DIR/setup/bootstrap.sh" ]] || find "$HARNESS_DIR/setup" -mindepth 1 -maxdepth 1 -type f ! -name 'bootstrap.sh' -print -quit | grep -q .; then
  echo "ERROR: setup/ must contain only bootstrap.sh"
  find "$HARNESS_DIR/setup" -mindepth 1 -maxdepth 1 -type f ! -name 'bootstrap.sh' -print
  exit 1
fi
if find "$HARNESS_DIR/setup" -mindepth 1 -maxdepth 1 ! -type f -print -quit | grep -q .; then
  echo "ERROR: setup/ may contain only bootstrap.sh"
  find "$HARNESS_DIR/setup" -mindepth 1 -maxdepth 1 ! -type f -print
  exit 1
fi

# SDD skillは各Agentが実際に探索する場所
# (.agents/skills/ for Codex etc., .claude/skills/ for Claude Code) に配置する。
for skill in sdd-project-requirements sdd-constitution sdd-specify sdd-plan sdd-tasks sdd-analyze; do
  agents_file=".agents/skills/${skill}/SKILL.md"
  claude_file=".claude/skills/${skill}/SKILL.md"
  for f in "$agents_file" "$claude_file"; do
    if [[ ! -f "$f" ]]; then
      echo "ERROR: required agent skill missing: $f"
      exit 1
    fi
  done

  # .claude/skills/ はforwarding copyなので、canonicalな .agents/skills/ と
  # frontmatterがずれていないことを確認する。
  fm_agents=$(sed -n '/^---$/,/^---$/p' "$agents_file")
  fm_claude=$(sed -n '/^---$/,/^---$/p' "$claude_file")
  if [[ "$fm_agents" != "$fm_claude" ]]; then
    echo "ERROR: frontmatter mismatch between $agents_file and $claude_file"
    exit 1
  fi
done

# Claude Code / CodexのStop lifecycle eventは、どちらも同じ公開入口へ接続する。
for hook_file in .claude/settings.json .codex/hooks.json; do
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$hook_file"

  if ! grep -F '"Stop"' "$hook_file" >/dev/null; then
    echo "ERROR: Stop hook missing from $hook_file"
    exit 1
  fi
done

if ! grep -F 'npm run harness:verify -- --hook' .claude/settings.json >/dev/null; then
  echo "ERROR: .claude/settings.json must delegate to npm run harness:verify -- --hook"
  exit 1
fi

# CodexのStop HookはstdoutがJSON専用。npmのログを隔離するwrapper経由で検証する。
if ! grep -F 'node .codex/stop-harness-json.mjs' .codex/hooks.json >/dev/null ||
   ! grep -F 'spawnSync("npm", ["run", "harness:verify", "--", "--hook"]' .codex/stop-harness-json.mjs >/dev/null; then
  echo "ERROR: .codex/hooks.json must delegate to npm run harness:verify -- --hook through its JSON wrapper"
  exit 1
fi

if ! grep -F 'hooks = true' .codex/config.toml >/dev/null; then
  echo "ERROR: .codex/config.toml must enable lifecycle hooks"
  exit 1
fi

node - <<'NODE'
const pkg = require('./package.json')
const expected = 'bash .agents/scripts/harness/harness-verify-orchestrator.sh'
if (pkg.scripts?.['harness:verify'] !== expected) {
  console.error(`ERROR: package.json harness:verify must be: ${expected}`)
  process.exit(1)
}
NODE

bash -n "$HARNESS_DIR/harness-verify-orchestrator.sh"
bash -n "$CHECKS_DIR/knowledge-base-check.sh"
bash -n "$CHECKS_DIR/spec-check.sh"
node --check "$HARNESS_DIR/tests/spec-check.test.mjs"
bash -n "$HARNESS_DIR/setup/bootstrap.sh"
node --check "$CHECKS_DIR/source-layout-check.mjs"

# 旧パスと廃止したStop Hook用adapterの再発をfail-closedで防ぐ。
# docs、hook、example、package metadataのどこにも残さない。
legacy_refs=(
  '.agents/scripts/harness-verify.sh'
  '.agents/scripts/harness/harness-verify.sh'
  '.agents/scripts/agent-stop-harness.mjs'
  'agent-stop-harness.mjs'
  '.agents/scripts/harness-bootstrap.sh'
  '.agents/scripts/knowledge-base-check.sh'
  '.agents/scripts/spec-check.sh'
  '.agents/scripts/source-layout-check.mjs'
  'bash scripts/spec-check.sh'
)
for legacy_ref in "${legacy_refs[@]}"; do
  if rg -n --hidden --glob '!.git/**' --glob '!**/knowledge-base-check.sh' --fixed-strings "$legacy_ref" . >/dev/null; then
    echo "ERROR: stale Harness path/reference found: $legacy_ref"
    rg -n --hidden --glob '!.git/**' --glob '!**/knowledge-base-check.sh' --fixed-strings "$legacy_ref" .
    exit 1
  fi
done

agents_lines=$(wc -l < AGENTS.md | tr -d ' ')
if (( agents_lines > 180 )); then
  echo "ERROR: AGENTS.md has ${agents_lines} lines. Keep it as a navigation map, not an encyclopedia."
  exit 1
fi

for target in ARCHITECTURE.md WORKFLOW.md .agents/ docs/; do
  if ! grep -F "$target" AGENTS.md >/dev/null; then
    echo "ERROR: AGENTS.md should point to $target"
    exit 1
  fi
done

for target in .agents/harness-engineering/ .agents/loop-engineering/ .agents/sdd/ .agents/standards/ .agents/profiles/ .agents/scripts/; do
  if ! grep -F "$target" AGENTS.md >/dev/null; then
    echo "ERROR: AGENTS.md should point to AI development system target $target"
    exit 1
  fi
done

# Fork-first starterではscaffold導入前でもapplication workspace境界を明示する。
for app_area in frontend/ backend/ infrastructure/; do
  if ! grep -F "$app_area" AGENTS.md >/dev/null; then
    echo "ERROR: AGENTS.md should define application area $app_area"
    exit 1
  fi
  if ! grep -F "$app_area" ARCHITECTURE.md >/dev/null; then
    echo "ERROR: ARCHITECTURE.md should define application area $app_area"
    exit 1
  fi
done

if ! grep -F "docs/maintainers/dev-standard-kit-maintenance.md" AGENTS.md >/dev/null; then
  echo "ERROR: AGENTS.md should point Kit Maintenance Mode to the maintainer guide"
  exit 1
fi

if [[ -f .agents/templates/long-running-agent/feature-list.json ]]; then
  node -e "JSON.parse(require('fs').readFileSync('.agents/templates/long-running-agent/feature-list.json','utf8'))"
fi

echo "Knowledge-base checks PASS"
