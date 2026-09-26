---
workflow_version: 4
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
6. `docs/constitution.md` を読む。
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
user flow selection → optional HTML mock for shared understanding → choose one vertical slice
  ↓ human confirms scope and business decisions
requirements.md (selected slice only)
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
- 全体要件から次に検討する利用者フローを一つ選ぶ。必要なら `.agents/skills/mockup` で簡易HTMLモックを作り、画面と流れのイメージ合わせに使う。モックは仮説を話し合うための成果物であり、正解・承認済み要件・実装仕様の代わりではない。
- 人間が業務判断と今回の範囲を確認した後、`.agents/skills/sdd-specify` で選択した縦切りに必要なFR/NFRだけを機能別requirementsへ具体化する。システム全体や複数段階を一度に詳細仕様化しない。
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
- 1つのSPECは、利用者が価値を確認でき受入条件を定義できる一つの縦切りを対象とする。大きい場合は独立して受け入れられる機能ループへ分け、依存関係を記録する。
- `tasks.md` がある場合は未完了taskを1つ選ぶ。
- 変更はspec/designと一致する最小のcoherent changeにする。
- unrelated refactorを混ぜない。
- frontend/backend/infrastructureの境界を崩さない。
- 実装と同時に必要なテストを追加または更新する。
- アプリ固有の事情だけで `.agents/standards/` や `.agents/harness-engineering/` を緩めない。
- 繰り返す失敗が共通的な不足を示した場合は、別途Kit MaintenanceとしてHarness改善を検討する。

## Pull requests

Pull Request は人間が変更目的とレビュー対象を一覧で判断するための境界として扱う。AI Coding Agent がPRを作成・更新する場合も次の命名規則に従う。

- PRタイトルは原則として `<type>: <日本語の変更概要>` とする。
- `<type>` は変更種別を表す短い英小文字の識別子とし、`feat`、`fix`、`spec`、`mockup`、`docs`、`refactor`、`test`、`chore`、`kit`、`ci`、`build` などを使用する。
- コロン以降の変更概要は日本語で記述し、PR一覧だけで何を変更するPRか判断できる具体的な内容にする。製品名、API名、Feature ID、技術用語などは必要に応じて英語表記のままでよい。
- `update files`、`fix issue`、`changes` のように変更対象や目的が分からない曖昧なタイトルを使用しない。
- 1つのPRには1つの明確な目的を持たせ、タイトルはその目的を表す。レビュー中にスコープや目的が変わった場合はタイトルも更新する。
- この規則は Application Development Mode と Kit Maintenance Mode の両方に適用する。

例:

- `spec: 相談開始の縦切り仕様を定義`
- `mockup: 相談・課題明確化フローのモックを追加`
- `kit: SPECディレクトリに固定Feature IDを導入`
- `fix: 相談開始失敗時に入力内容が消える不具合を修正`

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
