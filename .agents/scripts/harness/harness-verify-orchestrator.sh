#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CHECKS_DIR="$SCRIPT_DIR/checks"

cd "$REPO_ROOT"

# package.jsonに指定したnpm scriptが存在するか確認する。
has_script() {
  local script="$1"
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script'] ? 0 : 1)"
}

# 定義済みのnpm scriptだけを実行し、未定義ならスキップする。
run_if_script_exists() {
  local script="$1"
  if has_script "$script"; then
    echo
    echo "==> npm run $script"
    npm run "$script"
  else
    echo
    echo "==> SKIP npm run $script (script not defined)"
  fi
}

# Harnessの全検証ゲートを標準モードで順番に実行する。
run_harness() (
  set -euo pipefail
  local spec_mode="${1:---stage}"

  echo "=== Harness verification start ==="

  if [[ -f "$CHECKS_DIR/knowledge-base-check.sh" ]]; then
    echo
    echo "==> knowledge-base check"
    bash "$CHECKS_DIR/knowledge-base-check.sh"
  fi

  if [[ -f "$CHECKS_DIR/spec-check.sh" ]]; then
    echo
    echo "==> spec-check (docs/specs/ review, requirement traceability, task verification fields)"
    bash "$CHECKS_DIR/spec-check.sh" "$spec_mode"
    echo "==> spec-check regression tests"
    node --test "$SCRIPT_DIR/tests/spec-check.test.mjs"
  fi

  if [[ -f "$CHECKS_DIR/source-layout-check.mjs" ]]; then
    echo
    echo "==> H069 source layout / private helper JSDoc"
    node "$CHECKS_DIR/source-layout-check.mjs"
  fi

  if [[ -f package.json ]]; then
    run_if_script_exists "format:check"
    run_if_script_exists "typecheck"
    run_if_script_exists "lint"
    run_if_script_exists "test"
    run_if_script_exists "test:runtime"
    run_if_script_exists "test:worker"
    run_if_script_exists "test:integration"
    run_if_script_exists "build"
    run_if_script_exists "build-storybook"

    if has_script "test:e2e:run"; then
      run_if_script_exists "test:e2e:run"
    else
      run_if_script_exists "test:e2e"
    fi
  else
    echo
    echo "==> SKIP npm quality gates (package.json not found)"
  fi

  echo
  echo "==> git diff --check"
  git diff --check

  echo
  echo "==> verification bypass scan"
  if git diff -U0 | grep -E '^\+.*(test\.skip|it\.skip|describe\.skip|@ts-ignore|@ts-nocheck)' >/dev/null; then
    echo "ERROR: verification bypass pattern found in added lines"
    git diff -U0 | grep -E '^\+.*(test\.skip|it\.skip|describe\.skip|@ts-ignore|@ts-nocheck)' || true
    exit 1
  fi

  echo
  echo "=== Harness verification PASS ==="
)

# Stop Hook向けに検証結果と失敗時のexit codeを整形する。
run_hook_mode() {
  local log_file
  local status

  log_file="$(mktemp)"
  run_harness --stage 2>&1 | tee "$log_file"
  status="${PIPESTATUS[0]}"

  if (( status != 0 )); then
    {
      echo
      echo "Harness verification failed."
      echo "完了扱いにせず、失敗を修正してから再度停止してください。"
      echo "npm run harness:verify がPASSするまで作業を継続してください。"
      echo
      echo "---- harness failure tail ----"
      tail -n 120 "$log_file"
    } >&2
    rm -f "$log_file"
    return 2
  fi

  rm -f "$log_file"
  return 0
}

case "${1:-}" in
  "")
    run_harness
    ;;
  --hook)
    run_hook_mode
    ;;
  --spec-complete)
    run_harness --complete
    ;;
  *)
    echo "ERROR: unknown harness mode: $1" >&2
    echo "usage: $0 [--hook|--spec-complete]" >&2
    exit 64
    ;;
esac
