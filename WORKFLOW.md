---
workflow_version: 3
handoff_state: human-review
max_scope: one-task
---

# Application Development Workflow

このファイルは、`dev-standard-kit` をフォークした後に AI Coding Agent が従う標準開発フローを定義する。
通常の目的は **開発標準そのものを編集することではなく、仕様を固めてアプリを構築すること** である。
AI開発基盤の内部実装は `.agents/` に閉じ込め、通常のアプリ開発では必要な入口だけを参照する。

## Operating mode

### Application Development Mode

既定のモード。アプリの要件・仕様・実装・テストを進める。

主な変更先:
- `docs/specs/`
- `frontend/`
- `backend/`
- `infrastructure/`
- 必要に応じて `docs/design-docs/` / `docs/exec-plans/`

### Kit Maintenance Mode

`.agents/standards/`、`.agents/harness-engineering/`、`.agents/profiles/`、`.agents/templates/`、Agent Skills等、スターターのAI開発基盤そのものを改善する場合だけ使用する。
このモードでは `docs/maintainers/dev-standard-kit-maintenance.md` を先に読む。

## Start

1. `AGENTS.md` を読む。
2. `ARCHITECTURE.md` を読む。
3. Application Development Mode / Kit Maintenance Mode のどちらかを明確にする。通常はApplication Development Mode。
4. `git status` と最近の履歴を確認する。
5. アプリ機能を扱う場合は `docs/project-requirements.md` のFR/NFR台帳とレビュー状態を確認する。
6. `.agents/sdd/constitution.md` を読む。
7. 関係する既存の `docs/specs/`、design docs、`.agents/profiles/` を読む。
8. タスクの目的、acceptance criteria、risk boundaryを整理する。

## Specify before implementation

ユーザー可視の振る舞い、API契約、データ契約を変更する機能では、コードより先にspecを作る。

```text
Intent
  ↓
project requirements (FR/NFR) → human review
  ↓
constitution → human review
  ↓
requirements.md
  ↓ human review
 design.md
  ↓ human review
 tasks.md
  ↓ human review
 sdd-analyze
  ↓
Implementation
```

- `.agents/skills/sdd-project-requirements` で全体要件とFR/NFR台帳を作り、人間レビューを受ける。
- `.agents/skills/sdd-constitution` で共通原則を作り、人間レビューを受ける。
- `.agents/skills/sdd-specify` で対応するFR/NFRに紐づく機能別requirementsを作る。
- requirements の人間レビュー後に `.agents/skills/sdd-plan` で design を作る。
- design の人間レビュー後に `.agents/skills/sdd-tasks` で実装タスクへ分解する。
- tasks の人間レビュー後に `.agents/skills/sdd-analyze` で整合性を確認する。
- ReviewチェックをAIが勝手に完了扱いにしない。
- SDDの生成物は `docs/specs/<feature>/` に置く。
- ユーザー可視の振る舞いを持たない複雑なリファクタ・依存更新・infra変更は `docs/exec-plans/` を使う。

## Select implementation area

実装開始前に、各タスクがどの領域へ影響するかを明示する。

- `frontend/`: UI / component / state / browser-side API client
- `backend/`: API / business logic / repository / storage access
- `infrastructure/`: runtime / D1 / R2 / deploy / migration / binding

複数領域にまたがる場合も、1つの大きな変更として雑に実装せず、契約と依存順をdesign/tasksに残す。

## Work

- 一度に1つの明確なtaskへ集中する。
- `tasks.md` がある場合は未完了taskを1つ選ぶ。
- 変更はspec/designと一致する最小のcoherent changeにする。
- unrelated refactorを混ぜない。
- frontend/backend/infrastructureの境界を崩さない。
- 実装と同時に必要なテストを追加または更新する。
- アプリ固有の事情だけで `.agents/standards/` や `.agents/harness-engineering/` を緩めない。
- 繰り返す失敗が共通的な不足を示した場合は、別途Kit MaintenanceとしてHarness改善を検討する。

## Verify

1. `.agents/harness-engineering/verification-matrix.md` から変更内容に対応する検証を確認する。
2. 開発途中は必要に応じて対象領域の typecheck / lint / unit / runtime / integration / E2E / build を個別実行してよい。
3. **完了前は必ず `npm run harness:verify` を実行する。これをHarnessの唯一の公開入口とする。**
4. `.agents/scripts/harness/checks/` 配下の内部checkerは、Harness保守・デバッグを除き直接実行しない。
5. 検証を通すためだけに `test.skip`、`@ts-ignore`、`@ts-nocheck` 等を追加しない。
6. spec駆動機能では、実装結果と `requirements.md` / `design.md` / `tasks.md` の内容がずれていないか確認する。

## Handoff

完了時に次を残す。

- 実装したtask / requirement
- 変更したファイル
- frontend / backend / infrastructure のどこを変更したか
- 実行した検証とPASS/FAIL
- 未検証事項
- 判断・トレードオフ
- specとの差分が残っていないか
- 次に必要な作業

自動実行の成功状態は必ずしもプロジェクト全体の `Done` ではない。
必要に応じて `Human Review` をhandoff stateとする。

## Long-running work

複数セッションにまたがる場合は `.agents/loop-engineering/loop-contract.template.md` と `.agents/templates/long-running-agent/SESSION_PROTOCOL.md` を使い、progressと検証状態をdurable artifactとして残す。
