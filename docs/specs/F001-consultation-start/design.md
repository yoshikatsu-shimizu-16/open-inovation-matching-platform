# Design: F001 相談開始

> 出力元: `sdd-plan` スキル（`.agents/skills/sdd-plan/SKILL.md`）
> 出力先: `docs/specs/F001-consultation-start/design.md`
> 入力: `docs/specs/F001-consultation-start/requirements.md`（PR #7 でレビュー済み）

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
        v
D1
  consultations
```

責務は次のように分離する。

- `frontend/`: 自由記述入力、入力必須の即時検証、開始中・成功・失敗の画面状態、再試行を担当する。
- `backend/`: HTTP 契約、入力の最終検証、相談状態の生成、永続化、F001 から後続機能へ渡す handoff 情報の生成を担当する。
- `infrastructure/`: D1 の `consultations` テーブルを migration で追加する。
- 外部 AI は F001 の開始処理では呼び出さない。最初の問いと進行状態は決定的な bootstrap handoff として返し、AI の実応答がなくても正常系・障害系を検証可能にする。

F001 では 5 カテゴリ・13 項目の不足情報判定、質問選択、回答保存、数値的な進捗計算は実装しない。成功レスポンスは後続の `missing-information` 機能へ進める状態を示すだけとする。

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

### Backend

```text
backend/src/
├── app.ts
└── features/
    └── consultations/
        ├── route.ts
        ├── commands/
        │   └── start-consultation.ts
        ├── domain/
        │   └── consultation.ts
        ├── repository.ts
        └── d1-consultation-repository.ts
```

- `app.ts`
  - `app.route('/api/consultations', ...)` で consultations sub-app を合成する。
- `route.ts`
  - `POST /` を定義し、route 近傍で JSON request を検証する。
  - Hono handler は route 定義へ置き、Controller class は作らない。
  - D1 binding から repository を構成し、Command を実行する。
- `start-consultation.ts`
  - 相談状態を生成し、repository へ保存する。
  - 保存後、F001 用の deterministic bootstrap handoff を組み立てる。
- `domain/consultation.ts`
  - 相談開始時点の状態と入力不変条件を表す。
  - `content.trim().length > 0` を業務側でも保証し、frontend の検証だけに依存しない。
- `repository.ts`
  - F001 に必要な `create` の永続化境界だけを定義する。
- `d1-consultation-repository.ts`
  - D1 binding を使って consultation を保存する。
  - consultation 本文を一般ログへ出力しない。

F001 では相談の一覧・再表示・更新 API は公開しない。正式な利用者・組織単位のアクセス制御は後続仕様の対象であり、この feature では create-only の API と限定 preview 環境にスコープを留める。

### Infrastructure

`infrastructure/d1/migrations/0002_create_consultations.sql` を追加し、既存 migration は書き換えない。

R2 は F001 では利用しない。

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
  "handoff": {
    "nextFeature": "missing-information",
    "firstQuestion": {
      "id": "consultation-goal",
      "text": "この相談を通じて、どのような状態を実現したいですか？"
    },
    "progress": {
      "phase": "information-collection",
      "label": "相談内容の確認を開始しました"
    }
  }
}
```

`firstQuestion` は F001 の完了を確認するための bootstrap question であり、5 カテゴリ・13 項目から次の質問を選ぶアルゴリズムではない。後続 feature が不足情報判定を実装した時点で、その feature の契約へ置き換える。

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
  -> D1ConsultationRepository: INSERT consultations
  <- D1: persisted
  <- Hono: 201 + consultation + bootstrap handoff
  <- Frontend: firstQuestion + progress を表示
```

開始成功後も F001 の画面内で handoff 情報を表示する。未実装の回答画面へ自動遷移させないことで、後続 `missing-information` feature の仕様を先取りしない。

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
  - 自由記述入力から最初の問いと進行状態表示までの browser smoke を持つ。

### Backend / D1

- Domain unit test
  - non-blank を受理し、blank / whitespace-only を拒否する。
- Hono route test
  - valid request は `201`。
  - whitespace-only は `400` で、repository は呼ばれない。
- Workers + D1 integration test
  - migration 適用済みの local D1 に相談状態が保存される。
  - response に consultation body を含めず、bootstrap handoff を返す。
- Migration verification
  - 空 DB から `0001` → `0002` を順に local 適用できる。

実装完了時は repository 標準どおり `npm run harness:verify` を公開 verification entry point とする。

## Requirements traceability

| Requirement | Design element |
| --- | --- |
| REQ-001 | index route の `ConsultationStartPage`、`ConsultationStartForm` の textarea と開始操作 |
| REQ-002 | `ConsultationStartForm` の concrete placeholder と frontend component test |
| REQ-003 | frontend/backend の non-blank validation、`StartConsultation` command、D1 `consultations` 永続化 |
| REQ-004 | `201` response の `handoff.firstQuestion` / `handoff.progress` と成功状態 UI |
| REQ-005 | frontend の API 呼出し前 validation、backend の domain validation、D1 write を行わない negative test |
| REQ-006 | controlled input、`failed` state、入力を消去しない error handling、retry test |
| REQ-007 | consultation 本文を一般ログへ出さない backend 境界、public error へ内部情報を出さない既存 error mapping、secret を client/spec に持たない構成 |
| REQ-008 | React/Vite frontend、Hono/Workers backend、D1 migration、Playwright smoke、Workers + D1 integration、local migration verification |

## Risks / Alternatives considered

### 1. 5カテゴリ・13項目の質問ロジックを F001 に入れる

採用しない。F001 の責務が「相談開始」から「不足情報ヒアリング」まで膨らみ、機能ごとの review loop を壊す。F001 は deterministic bootstrap handoff までに留める。

### 2. 最初の問いと進行状態を frontend の定数だけで持つ

採用しない。backend が consultation 作成成功と後続 handoff を 1 つの契約として返した方が、作成に失敗したのに UI だけ先へ進む状態を避けやすい。また後続 feature が handoff contract を置き換える場所も明確になる。

### 3. 作成成功直後に `/consultations/:id` へ遷移する

F001 では採用しない。この route を成立させるには consultation 再取得や回答処理など未仕様の API が必要になる。同一画面で成功状態を表示し、後続 feature の設計後に遷移を追加する。

### 4. R2 へ相談本文を保存する

採用しない。F001 の consultation は小さく構造化された状態で、検索・更新対象となる可能性が高いため D1 を利用する。R2 は大きな object storage が必要になった feature で検討する。

### 5. idempotency key を F001 から導入する

現時点では採用しない。通常の retry は要件に含むが、通信結果不明時の重複防止までは要求されていない。重複が受入上の問題になった場合は API / data contract の変更として仕様へ追加する。

### 6. 正式な認証・組織アクセス制御を F001 へ含める

採用しない。`requirements.md` で明示的に対象外である。F001 は create-only API と限定 preview を前提とし、相談の read/list endpoint は公開しない。認証・利用者単位の再表示を導入するときに専用 SPEC でアクセス境界を定義する。

## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
