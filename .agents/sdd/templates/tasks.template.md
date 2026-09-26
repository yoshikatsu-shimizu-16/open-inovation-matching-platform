# Tasks: <feature>

> 出力元: `sdd-tasks` スキル(`.agents/skills/sdd-tasks/SKILL.md`)
> 出力先: `docs/specs/<feature>/tasks.md`
> 入力: `docs/specs/<feature>/requirements.md`, `design.md`(いずれもレビュー済みであること)

各タスクは`harness/task-contract-template.md`に相当する単一セッションで完結する粒度にする。
依存関係のないタスクは並行実装してよい。

## Task list

各タスクは`verifies`に`requirements.md`の要求ID(`REQ-001`等)を、`checks`に
`harness/verification-matrix.md`の変更種別に対応する検証(typecheck/lint/unit/runtime/
integration/e2e/build)をカンマ区切りで明記する。該当しない検証は省略してよいが、
1つも書かないことは認めない。対象外なら `checks: N/A(理由)` と書く。

- [ ] T001: <task> — depends on: none — verifies: REQ-001 — checks: typecheck, lint, unit
- [ ] T002: <task> — depends on: T001 — verifies: REQ-002 — checks: typecheck, lint, integration

## Verification per task

`checks`フィールドの各項目は`harness/verification-matrix.md`の該当する行に対応させ、
実行コマンドは`harness/quality-gates.md`のGate 1-7を参照する。

## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
