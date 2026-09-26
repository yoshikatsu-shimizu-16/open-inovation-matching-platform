# Design: F001 相談開始

> 出力元: `sdd-plan` スキル（`.agents/skills/sdd-plan/SKILL.md`）
> 出力先: `docs/specs/F001-consultation-start/design.md`
> 入力: `docs/specs/F001-consultation-start/requirements.md`（PR #7 でレビュー済み）
> 関連設計判断: `docs/design-docs/backend-persistence-architecture.md`

## Architecture overview

F001 は、相談者の自由記述を起点に相談状態を永続化し、作成成功後に「最初の問い」と「現在の進行状態」を表示するところまでを 1 つの vertical slice として実装する。

```text
React / Vite
  consultation-start feature
        |
        | POST /api/consultations
        v
Hono / Cloudflare Workers
  consultations feature
        |
        | repository.ts
        v
Drizzle ORM
        |
        v
Cloudflare D1
  consultations
```

責務は次のように分離する。

- `frontend/`: 自由記述入力、入力必須の即時検証、開始中・成功・失敗の画面状態、再試行を担当する。
- `backend/`: HTTP 契約、入力の最終検証、相談状態の生成、永続化、作成直後に表示する最初の問いと進行状態の生成を担当する。
- `infrastructure/`: D1 の `consultations` テーブルを migration で追加し、preview 環境のアクセス境界を構成する。
- DB アクセスには Drizzle ORM を利用し、feature から D1 の低レベル API を直接操作しない。
- 外部 AI は F001 の開始処理では呼び出さない。最初の問いと進行状態は決定的な初期状態として返し、AI の実応答がなくても正常系・障害系を検証可能にする。

F001 では 5 カテゴリ・13 項目の不足情報判定、質問選択、回答保存、数値的な進捗計算は実装しない。成功レスポンスは相談作成直後の状態を返すだけとし、後続 `missing-information` feature の仕様を先取りしない。

## Components / Modules

### Frontend

```text
frontend/src/
├── app/
│   └── routes.tsx
├── api/
│   ├── httpClient.ts
│   └── consultations.ts
└── features/
    └── consultation-start/
        ├── ConsultationStartPage.tsx
        ├── ConsultationStartForm.tsx
        └── useConsultationStart.ts
```

- `app/routes.tsx`
  - 現在の index route のスターター画面を `ConsultationStartPage` に置き換える。
  - F001 のためだけに別の `BrowserRouter` は作らない。
- `ConsultationStartPage`
  - feature の composition を担当する。
  - 開始前は入力フォームを表示し、開始成功後はレスポンスの `firstQuestion` と `progress` を表示する。
  - F001 では成功後に未実装の別 route へ遷移しない。
- `ConsultationStartForm`
  - controlled textarea と開始操作を持つ。
  - placeholder は `requirements.md` で確認済みの具体例を表示する。
  - `trim()` 後が空なら API を呼ばず入力必須を表示する。
  - 送信中は同一操作の多重実行を抑止する。
- `useConsultationStart`
  - `idle / submitting / succeeded / failed` の画面状態を管理する。
  - API 失敗時も入力値を保持し、同じ内容で再試行できるようにする。
- `api/consultations.ts`
  - `POST /api/consultations` の request / response 型と API 呼び出しを集約する。
  - Component 内で server response の shape を再定義しない。
  - 共通 HTTP error 処理は既存 `httpClient.ts` を利用または最小限拡張する。

`frontend/src/api/` はブラウザから backend API へアクセスする client 境界として維持し、feature 配下へ別の `api/` ディレクトリは追加しない。

### Backend

```text
backend/src/
├── app.ts
├── shared/
│   └── database/
│       ├── db.ts
│       └── schema/
│           └── consultations.ts
└── features/
    └── consultations/
        ├── route.ts
        ├── commands/
        │   └── start-consultation.ts
        ├── domain/
        │   └── consultation.ts
        └── repository.ts
```

- `app.ts`
  - `app.route('/api/consultations', ...)` で consultations sub-app を合成する。
- `shared/database/db.ts`
  - Cloudflare の `D1Database` binding から Drizzle の DB オブジェクトを生成する。
  - D1 binding と ORM 初期化を feature から分離する。
- `shared/database/schema/consultations.ts`
  - `consultations` テーブルの Drizzle schema を定義する。
  - migration と schema の不整合を verification 対象にする。
- `route.ts`
  - `POST /` を定義し、route 近傍で JSON request を検証する。
  - Hono handler は route 定義へ置き、Controller class は作らない。
  - `c.env.DB` を共通 DB factory へ渡して Drizzle DB を構成し、feature repository と Command を組み立てる。
- `commands/start-consultation.ts`
  - 相談状態を生成し、repository へ保存する。
  - 保存後、F001 用の `firstQuestion` と `progress` を組み立てる。
- `domain/consultation.ts`
  - 相談開始時点の状態と入力不変条件を表す。
  - `content.trim().length > 0` を業務側でも保証し、frontend の検証だけに依存しない。
- `repository.ts`
  - F001 に必要な `create` の永続化境界を定義する。
  - 実際の DB 操作は Drizzle を利用する。
  - D1 の `prepare()` / `bind()` / `run()` を feature 内で直接利用しない。
  - consultation 本文を一般ログへ出力しない。

`d1-consultation-repository.ts` や `drizzle-consultation-repository.ts` は作成しない。D1 や Drizzle は永続化の実装技術であり、feature の業務責務名ではない。Repository の命名・配置は `docs/design-docs/backend-persistence-architecture.md` に従う。

F001 では相談の一覧・再表示・更新 API は公開しない。

### Infrastructure

`infrastructure/d1/migrations/0002_create_consultations.sql` を追加し、既存 migration は書き換えない。

Drizzle schema は backend の型安全な DB access の source として利用し、D1 へ適用する schema 変更は repository 標準どおり migration として管理する。migration と Drizzle schema の対応は実装時の verification で確認する。

R2 は F001 では利用しない。

### Preview access boundary

相談本文は非公開情報を含み得るため、remote preview を無制限公開しない。

F001 の preview は Cloudflare Access 等の infrastructure-level gate で許可された利用者だけが到達できる構成とする。正式なアプリ内ログイン・組織権限モデルは後続 SPEC の対象とするが、それを理由に preview のアクセス境界を無くさない。

```text
Internet
  ↓
Cloudflare Access / equivalent preview gate
  ↓
Workers + Assets
  ├── React SPA
  └── Hono API
        ↓
        D1
```

## Data model

### D1: consultations

| Column | Type | Constraint | Purpose |
| --- | --- | --- | --- |
| `id` | TEXT | PRIMARY KEY | consultation identifier。Workers runtime で `crypto.randomUUID()` を生成する |
| `initial_content` | TEXT | NOT NULL | 相談者が開始時に入力した自由記述。空白だけの値は domain で拒否する |
| `status` | TEXT | NOT NULL | F001 作成直後は `collecting_information` |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| `updated_at` | TEXT | NOT NULL | ISO 8601 UTC timestamp。作成時は `created_at` と同値 |

F001 では初期入力を別テーブルへ分割しない。相談開始時点では 1 consultation に 1 initial input であり、後続の回答モデルを先取りしないためである。

### API contract

#### Request

`POST /api/consultations`

```json
{
  "content": "自社の技術を活用できる共同研究先を探したい"
}
```

- `content` は string 必須。
- `trim()` 後が空の場合は `400` とし、consultation を作成しない。
- F001 では利用者向けの任意文字数上限を新設しない。HTTP/runtime 側の安全上限とは分離する。

#### Success response

`201 Created`

```json
{
  "consultation": {
    "id": "<uuid>",
    "status": "collecting_information",
    "createdAt": "<ISO-8601>"
  },
  "firstQuestion": {
    "id": "consultation-goal",
    "text": "この相談を通じて、どのような状態を実現したいですか？"
  },
  "progress": {
    "phase": "information-collection",
    "label": "相談内容の確認を開始しました"
  }
}
```

`handoff` や `nextFeature` といった内部の feature 構成を API 契約へ露出させない。

`firstQuestion` は F001 の完了を確認するための初期質問であり、5 カテゴリ・13 項目から次の質問を選ぶアルゴリズムではない。後続 feature が不足情報判定を実装した時点で、その feature の契約として設計する。

`progress` は F001 では現在フェーズを示すラベルまでとし、回答済み件数・13 項目中の割合などは定義しない。

#### Error response

既存の共通 `ApiErrorResponse` を利用する。

- 空白のみ: `400`, code は `INVALID_CONSULTATION_CONTENT`
- 想定外の永続化失敗: `500`, public response に stack・SQL・consultation 本文を含めない
- frontend は失敗レスポンスや network error の際に textarea を消去せず、再試行可能なメッセージを表示する

## Sequence

### Normal flow

```text
User
  -> ConsultationStartForm: 自由記述を入力して開始
  -> Frontend validation: trim後が空でないことを確認
  -> POST /api/consultations
  -> Hono route: request validation
  -> StartConsultation command: consultation生成
  -> Consultation repository: Drizzle経由でINSERT
  -> D1: persisted
  <- Hono: 201 + consultation + firstQuestion + progress
  <- Frontend: firstQuestion + progress を表示
```

開始成功後も F001 の画面内で `firstQuestion` と `progress` を表示する。未実装の回答画面へ自動遷移させないことで、後続 `missing-information` feature の仕様を先取りしない。

### Blank input

```text
User -> Frontend validation
     <- 入力必須を表示

API call: なし
D1 write: なし
```

backend に直接空白のみの request が送られた場合も同じ不変条件を検証し、`400` で拒否する。

### Start failure and retry

```text
User -> POST /api/consultations
     -> Backend / D1: failure
     <- error
     <- Frontend: 入力内容を保持したまま再試行可能な状態を表示
```

F001 では network timeout 後の重複作成を完全に防ぐ idempotency contract までは導入しない。曖昧な通信失敗で重複相談が問題になることが確認された場合は、client request key を追加する設計変更として扱う。

## Local runtime / E2E wiring

Playwright の browser smoke は frontend だけを起動して mock API を見るテストにはしない。実際の Hono API と local D1 まで接続する。

production と同じ `/api/*` 契約を browser から利用できるよう、E2E 実行時は frontend と Hono/Workers を同一導線に統合する。実装時は Workers + Assets を使って SPA と API を同一 origin で起動する構成を第一候補とし、既存 harness との整合で分離起動が必要な場合は Vite `/api` proxy を明示的に構成する。

少なくとも次を満たすことを E2E の前提条件とする。

```text
Browser
  ↓ POST /api/consultations
local frontend origin
  ↓ /api/*
Hono / Workers runtime
  ↓
local D1
```

`vite preview` だけを起動して `/api/consultations` が 404 になる構成は browser smoke の検証環境として扱わない。

## Verification design

### Frontend

- Component / hook test
  - 具体的 placeholder が表示される。
  - 空白のみでは API が呼ばれず入力必須になる。
  - 成功レスポンスから `firstQuestion` と `progress` が表示される。
  - API / network failure 後も入力内容が残り、再試行できる。
- Route resolution test
  - index route が `ConsultationStartPage` を表示する。
- Storybook
  - idle / submitting / failed / succeeded の主要状態を isolated に確認できるようにする。
- Playwright
  - frontend → Hono → local D1 の実導線で、自由記述入力から最初の問いと進行状態表示までの browser smoke を持つ。

### Backend / D1

- Domain unit test
  - non-blank を受理し、blank / whitespace-only を拒否する。
- Hono route test
  - valid request は `201`。
  - whitespace-only は `400` で、repository は呼ばれない。
- Repository / Drizzle integration test
  - repository が Drizzle 経由で consultation を保存できる。
  - feature code が D1 の低レベル query API へ直接依存しない構成を維持する。
- Workers + D1 integration test
  - migration 適用済みの local D1 に相談状態が保存される。
  - response に consultation body を含めず、`firstQuestion` と `progress` を返す。
- Migration verification
  - 空 DB から `0001` → `0002` を順に local 適用できる。
  - Drizzle schema と適用後 D1 schema が F001 のデータ契約上整合している。
- Preview access verification
  - remote preview はアクセス境界を通らなければ利用できない。

実装完了時は repository 標準どおり `npm run harness:verify` を公開 verification entry point とする。

## Requirements traceability

| Requirement | Design element |
| --- | --- |
| REQ-001 | index route の `ConsultationStartPage`、`ConsultationStartForm` の textarea と開始操作 |
| REQ-002 | `ConsultationStartForm` の concrete placeholder と frontend component test |
| REQ-003 | frontend/backend の non-blank validation、`StartConsultation` command、Drizzle repository、D1 `consultations` 永続化 |
| REQ-004 | `201` response の `firstQuestion` / `progress` と成功状態 UI |
| REQ-005 | frontend の API 呼出し前 validation、backend の domain validation、D1 write を行わない negative test |
| REQ-006 | controlled input、`failed` state、入力を消去しない error handling、retry test |
| REQ-007 | preview access boundary、consultation 本文を一般ログへ出さない backend 境界、public error へ内部情報を出さない既存 error mapping、secret を client/spec に持たない構成 |
| REQ-008 | React/Vite frontend、Hono/Workers backend、Drizzle + D1、migration、実API接続 Playwright smoke、Workers + D1 integration、local migration verification |

## Risks / Alternatives considered

### 1. 5カテゴリ・13項目の質問ロジックを F001 に入れる

採用しない。F001 の責務が「相談開始」から「不足情報ヒアリング」まで膨らみ、機能ごとの review loop を壊す。F001 は相談作成直後の最初の問いと進行状態までに留める。

### 2. 最初の問いと進行状態を frontend の定数だけで持つ

採用しない。backend が consultation 作成成功と初期表示情報を 1 つの契約として返した方が、作成に失敗したのに UI だけ先へ進む状態を避けやすい。

### 3. API response に `handoff` / `nextFeature` を持たせる

採用しない。これらは実装上の feature 境界を表す内部用語であり、F001 の利用者向け契約ではない。`firstQuestion` と `progress` を直接返す。

### 4. 作成成功直後に `/consultations/:id` へ遷移する

F001 では採用しない。この route を成立させるには consultation 再取得や回答処理など未仕様の API が必要になる。同一画面で成功状態を表示し、後続 feature の設計後に遷移を追加する。

### 5. D1 API を feature repository から直接呼ぶ

採用しない。D1 は SQLite semantics を持つが Workers からは `D1Database` binding 経由で接続する。共通 DB 初期化で Drizzle と D1 binding を接続し、feature repository は Drizzle 経由で永続化する。

### 6. `d1-consultation-repository.ts` / `drizzle-consultation-repository.ts` を作る

採用しない。D1 と Drizzle は実装技術であり feature の責務名ではない。既存 Hono Profile の `features/<feature>/repository.ts` を永続化境界として利用する。

### 7. `ports/` / `adapters/` / `persistence/` を feature に追加する

採用しない。別のアーキテクチャ語彙を追加せず、既存の Feature-oriented Vertical Slice Architecture に従って `repository.ts` へ永続化境界を凝集する。

### 8. R2 へ相談本文を保存する

採用しない。F001 の consultation は構造化された状態で、検索・更新対象となるため D1 を利用する。R2 は object storage が必要な feature で検討する。

### 9. idempotency key を F001 から導入する

現時点では採用しない。通常の retry は要件に含むが、通信結果不明時の重複防止までは要求されていない。重複が受入上の問題になった場合は API / data contract の変更として仕様へ追加する。

### 10. 正式な認証・組織アクセス制御を F001 へ含める

採用しない。正式な認証モデルは `requirements.md` で対象外である。一方、相談本文を保存する remote preview を無制限公開することも採用しない。F001 では infrastructure-level の preview gate を設け、正式認証は専用 SPEC で設計する。

## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
