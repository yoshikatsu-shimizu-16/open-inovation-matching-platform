# Tasks: F001 相談開始

> 出力元: `sdd-tasks` スキル（`.agents/skills/sdd-tasks/SKILL.md`）
> 出力先: `docs/specs/F001-consultation-start/tasks.md`
> 入力: `docs/specs/F001-consultation-start/requirements.md`, `design.md`（いずれもレビュー済み）

各タスクは `.agents/harness-engineering/task-contract-template.md` 相当の単一セッションで完結する粒度とする。
依存関係のないタスクは並行実装してよい。

## Task list

- [ ] T001: backend に Drizzle ORM を導入し、`shared/database/db.ts` と `shared/database/schema/consultations.ts` を追加して、`D1Database` binding から型付き Drizzle DB を生成する共通DB基盤を確立する — depends on: none — verifies: REQ-003, REQ-007 — checks: typecheck, lint, unit, runtime, integration, e2e, build
- [ ] T002: `consultations` テーブルの D1 migration `0002_create_consultations.sql` を追加し、空DBへ `0001` → `0002` の順で適用でき、Drizzle schema とデータ契約が整合することを検証する — depends on: T001 — verifies: REQ-003, REQ-008 — checks: typecheck, lint, runtime, integration, build
- [ ] T003: `features/consultations/domain/consultation.ts` と `repository.ts` を実装し、空白のみの相談本文を拒否する不変条件と、Drizzle 経由で相談状態を保存する永続化境界を確立する。feature 内では D1 の `prepare()` / `bind()` / `run()` を直接利用せず、相談本文を一般ログへ出力しない — depends on: T001, T002 — verifies: REQ-003, REQ-005, REQ-007 — checks: typecheck, lint, unit, runtime, integration, build
- [ ] T004: Playwright のローカル実行経路を Workers + Assets + Hono + local D1 の同一origin導線へ接続し、`vite preview` 単独ではなく実際の `/api/*` と migration 適用済み local D1 まで到達できる browser E2E 基盤を先に確立する。F001 固有 API 実装前でも既存 backend route を用いて same-origin の browser → Hono → local D1 導線を検証可能にし、後続 T005/T006 が変更対象そのものを E2E できる状態を作る — depends on: T002 — verifies: REQ-008 — checks: typecheck, lint, runtime, integration, e2e, build
- [ ] T005: `commands/start-consultation.ts` と Hono `route.ts` を実装し、`POST /api/consultations` の入力検証、相談作成、`201` 応答の `consultation` / `firstQuestion` / `progress`、空白入力 `400`、永続化失敗時の公開エラー境界を成立させる。空白入力時は repository を呼ばず D1 に行が追加されないこと、成功応答の `consultation` に `content` / `initialContent` / `initial_content` 等の相談本文が含まれないことを integration test で検証する。さらに T004 の実ランタイムを使い、Playwright から `POST /api/consultations` を実際に通して Hono + local D1 まで到達する API contract E2E を追加する — depends on: T003, T004 — verifies: REQ-003, REQ-004, REQ-005, REQ-007, REQ-008 — checks: typecheck, lint, unit, runtime, integration, e2e, build
- [ ] T006: frontend の `httpClient.ts` に必要な POST 通信能力を追加し、`api/consultations.ts` に `POST /api/consultations` の request / response 型と API client を実装する。同じタスクで `ConsultationStartPage` / `ConsultationStartForm` / `useConsultationStart` と index route まで接続し、自由記述欄、具体的 placeholder、空入力 validation、送信中状態、成功時の最初の問い・進行状況、失敗時の本文保持と再試行を実現する。server response shape を component 側で再定義せず、主要状態の Storybook と、T004/T005 の実ランタイムを通って frontend API client → Hono → local D1 まで到達する相談開始 Playwright フローを追加する — depends on: T005 — verifies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008 — checks: typecheck, lint, unit, integration, e2e, build
- [ ] T007: Cloudflare preview を無制限公開しない infrastructure-level access boundary を実装する。Cloudflare Access等のrepo管理可能なgateを第一候補とし、必要な前提が未設定なら remote preview を fail-closed にする。secretをコード・仕様へ埋め込まず、production deploy / production resource変更は人間承認なしに実行しない — depends on: T005 — verifies: REQ-007, REQ-008 — checks: typecheck, lint, unit, runtime, integration, e2e, build
- [ ] T008: F001 の統合受入検証を完成させ、自由記述開始から最初の問い・進行状況表示、空入力、失敗後再試行、D1永続化、ログ/公開エラー境界、preview access boundaryを横断確認する。空白入力では D1 の行数が増えないこと、成功応答に相談本文が含まれないことも受入検証へ含め、`npm run harness:verify` を最終公開verification entry pointとしてPASSさせる — depends on: T006, T007 — verifies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008 — checks: typecheck, lint, unit, runtime, integration, e2e, build

## Dependency notes

```text
T001 Drizzle / DB foundation
  └─ T002 D1 migration
       ├─ T003 domain + repository
       └─ T004 local same-origin E2E runtime

T003 + T004
  └─ T005 command + API route + API contract E2E
       ├─ T006 frontend API client + consultation-start UI + main E2E
       └─ T007 preview access boundary

T006 + T007
  └─ T008 integrated acceptance / harness verification
```

T004 は F001 固有 API より先に browser → Hono → local D1 の実行基盤を成立させる。これにより T005 は `POST /api/consultations` 自体を、T006 は frontend API client を含む利用者フロー自体を、それぞれのタスク完了時点で full E2E 検証できる。変更対象を通らない既存 starter smoke だけを T005/T006 の E2E 根拠にはしない。

T007 ではproduction deploy、production migration、secret変更、production resourceへの破壊的変更を自動実行しない。必要なCloudflare側の承認操作は task contract の approval boundary として人間へ引き渡す。

## Verification per task

`checks` フィールドの各項目は `.agents/harness-engineering/verification-matrix.md` の該当する変更種別に対応する最低検証を列挙する。T001 の dependency update に対する `e2e` は既存 browser smoke の回帰確認でよいが、API contract を変更する T005 と API client / React component を変更する T006 は、変更した境界そのものを通る full E2E を各タスク内で追加して実行する。各実装タスクの完了前には `WORKFLOW.md` に従って root の `npm run harness:verify` を実行し、T008でF001全体の完了根拠をまとめる。

## Review


- Status: reviewed
- Evidence: PR #15
- Reviewed at: 2026-09-27T02:50:37.000Z
- Reviewed by: @yoshikatsu-shimizu-16
