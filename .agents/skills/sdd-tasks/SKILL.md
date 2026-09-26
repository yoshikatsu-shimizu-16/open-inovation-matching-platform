---
name: sdd-tasks
description: レビュー済みのrequirements.mdとdesign.mdから実装タスクの一覧(tasks.md)を作る。設計のレビューが完了してから使う。
---

# Tasks

## Output

`docs/specs/<feature-slug>/tasks.md`
(テンプレート: `.agents/sdd/templates/tasks.template.md`)

## Inputs

- `docs/specs/<feature-slug>/requirements.md`
- `docs/specs/<feature-slug>/design.md`(`## Review` が `Status: reviewed` でPR証跡を持つこと)
- `.agents/harness-engineering/task-contract-template.md`(各タスクの粒度の基準)

## Steps

1. `design.md`のReview metadataが `Status: reviewed` であることを確認する。未レビューなら止めて`sdd-plan`へ差し戻す。
2. `.agents/sdd/templates/tasks.template.md`を
   `docs/specs/<feature-slug>/tasks.md`へコピーする。
3. design.mdのRequirements traceability表を基に、実装タスクへ分解する。
   各タスクは`.agents/harness-engineering/task-contract-template.md`相当の、単一セッションで完結する粒度にする。
4. 各タスクに `depends on` と `verifies`(requirements.mdの要求ID、例: `REQ-001`)を明記する。
   依存のないタスクは並行実装できることを示す。
5. 各タスクに `checks`(`.agents/harness-engineering/verification-matrix.md`の変更種別に対応する検証。
   typecheck/lint/unit/runtime/integration/e2e/build)を明記する。1つも書かないことは認めない。
   対象外なら `checks: N/A(理由)` と書く。
6. tasks.md の `## Review` は `Status: pending` のまま人間レビュー用PRへ出す。既存のレビュー済みtasksを実質変更する場合もpendingへ戻す。

## Stop condition

- tasks用PRが人間にMergeされ、`.github/workflows/sdd-review-evidence.yml` により `## Review` が `Status: reviewed`、`Evidence: PR #N` へ同期されるまで `sdd-analyze` スキル・実装へは進まない。

## Boundary

タスクの実装(コードを書くこと)自体はこのスキルの責務ではない。
実装は`.agents/harness-engineering/task-contract-template.md`に従って1タスクずつ行う。
