# Tasks: F001 相談開始

> 出力元: `sdd-tasks` スキル（`.agents/skills/sdd-tasks/SKILL.md`）
> 出力先: `docs/specs/F001-consultation-start/tasks.md`
> 入力: `docs/specs/F001-consultation-start/requirements.md`, `design.md`（いずれもレビュー済み）

各タスクは `.agents/harness-engineering/task-contract-template.md` 相当の単一セッションで完結する粒度とする。
依存関係のないタスクは並行実装してよい。

## Task list

- [ ] T001: backend に Drizzle ORM を導入し、`shared/database/db.ts` と `shared/database/schema/consultations.ts` を追加して、`D1Database` binding から型付き Drizzle DB を生成する共通DB基盤を確立する — depends on: none — verifies: REQ-003, REQ-007 — checks: typecheck, lint, unit, runtime, build
- [ ] T002: `consultations` テーブルの D1 migration `0002_create_consultations.sql` を追加し、空DBへ `0001` → `0002` の順で適用でき、Drizzle schema とデータ契約が整合することを検証する — depends on: T001 — verifies: REQ-003, REQ-008 — checks: typecheck, lint, runtime, integration, build
- [ ] T003: `features/consultations/domain/consultation.ts` と `repository.ts` を実装し、空白のみの相談本文を拒否する不変条件と、Drizzle 経由で相談状態を保存する永続化境界を確立する。feature 内では D1 の `prepare()` / `bind()` / `run()` を直接利用せず、相談本文を一般ログへ出力しない — depends on: T001, T002 — verifies: REQ-003, REQ-005, REQ-007 — checks: typecheck, lint, unit, runtime, integration, build
- [ ] T004: `commands/start-consultation.ts` と Hono `route.ts` を実装し、`POST /api/consultations` の入力検証、相談作成、`201` 応答の `consultation` / `firstQuestion` / `progress`、空白入力 `400`、永続化失敗時の公開エラー境界を成立させる — depends on: T003 — verifies: REQ-003, REQ-004, REQ-005, REQ-007 — checks: typecheck, lint, unit, runtime, integration, build
- [ ] T005: frontend の `httpClient.ts` に必要な POST 通信能力を追加し、`api/consultations.ts` に `POST /api/consultations` の request / response 型とAPI clientを実装する。server response shape を component 側で再定義せず、network/API error をUIが判定可能な形で返す — depends on: T004 — verifies: REQ-003, REQ-004, REQ-006, REQ-008 — checks: typecheck, lint, unit, integration, build
- [ ] T006: Playwright のローカル実行経路を Workers + Assets + Hono + local D1 の同一origin導線へ接続し、`vite preview` 単独ではなく実際の `/api/*` と migration 適用済み local D1 まで到達する browser smoke 環境を構成する — depends on: T002, T004 — verifies: REQ-008 — checks: typecheck, lint, runtime, integration, e2e, build
- [ ] T007: `ConsultationStartPage` / `ConsultationStartForm` / `useConsultationStart` と index route を実装し、自由記述欄、具体的placeholder、空入力validation、送信中状態、成功時の最初の問い・進行状況、失敗時の本文保持と再試行を実現する。主要状態のStorybookと、T006の実ランタイムを使う相談開始Playwrightフローを追加する — depends on: T005, T006 — verifies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008 — checks: typecheck, lint, unit, e2e, build
- [ ] T008: Cloudflare preview を無制限公開しない infrastructure-level access boundary を実装する。Cloudflare Access等のrepo管理可能なgateを第一候補とし、必要な前提が未設定なら remote preview を fail-closed にする。secretをコード・仕様へ埋め込まず、production deploy / production resource変更は人間承認なしに実行しない — depends on: T004 — verifies: REQ-007, REQ-008 — checks: runtime, integration, e2e, build
- [ ] T009: F001 の統合受入検証を完成させ、自由記述開始から最初の問い・進行状況表示、空入力、失敗後再試行、D1永続化、ログ/公開エラー境界、preview access boundaryを横断確認し、`npm run harness:verify` を最終公開verification entry pointとしてPASSさせる — depends on: T007, T008 — verifies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008 — checks: typecheck, lint, unit, runtime, integration, e2e, build

## Dependency notes

```text
T001 Drizzle / DB foundation
  └─ T002 D1 migration
       └─ T003 domain + repository
            └─ T004 command + API route
                 ├─ T005 frontend API client
                 │    └─ T007 consultation-start UI + main E2E
                 ├─ T006 local same-origin E2E runtime
                 │    └─ T007 consultation-start UI + main E2E
                 └─ T008 preview access boundary

T007 + T008
  └─ T009 integrated acceptance / harness verification
```

T005 はAPI契約そのものはレビュー済み `design.md` をsource of truthとするが、verification-matrixでAPI clientにintegrationを要求しているため、実Hono APIを持つ T004 の完了後に実施する。

T008 ではproduction deploy、production migration、secret変更、production resourceへの破壊的変更を自動実行しない。必要なCloudflare側の承認操作は task contract の approval boundary として人間へ引き渡す。

## Verification per task

`checks` フィールドの各項目は `.agents/harness-engineering/verification-matrix.md` の該当する変更種別に対応させる。各実装タスクでは変更領域の個別検証を行い、T009で `npm run harness:verify` を実行してF001全体の完了根拠をまとめる。

## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
