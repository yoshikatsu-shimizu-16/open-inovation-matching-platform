# Backend Persistence Architecture

- Status: accepted
- Date: 2026-09-26
- Scope: `backend/` の永続化境界と ORM 利用方針

## Context

このプロジェクトの backend は Hono を用いた Feature-oriented Vertical Slice Architecture を採用し、feature ごとに `route.ts`、`commands/`、`domain/`、必要な場合は `repository.ts` を配置する。

永続化先は Cloudflare D1 を利用するが、feature の構造や命名を D1 や ORM 製品名へ過度に依存させない。将来 DB 製品や接続方式が変わった場合でも、業務ロジックと永続化技術の変更理由を分離できる構成を維持する。

また、TypeScript の feature 構造へ Java の `XxxRepository` / `XxxRepositoryImpl` や Clean Architecture の `ports/` / `adapters/` を機械的に持ち込まない。既存 Hono Profile の vertical slice 構成を基準とし、必要な責務を feature 内へ凝集させる。

## Decision

### 1. Feature の永続化境界は `repository.ts` に置く

永続化が必要な feature は次を基本形とする。

```text
features/
└── <feature>/
    ├── route.ts
    ├── commands/
    ├── domain/
    └── repository.ts
```

`repository.ts` は feature 固有の永続化契約と、その契約を満たす永続化処理を配置する場所とする。

ファイル名には原則として `d1-`、`drizzle-`、`postgres-` などの製品名・ライブラリ名を付けない。これらは実装技術であり、feature の業務責務ではないためである。

TypeScript では Java の `XxxRepositoryImpl` を機械的に作らず、必要であれば同じ `repository.ts` で contract と factory を公開する。

```ts
export interface ConsultationRepository {
  create(consultation: Consultation): Promise<void>;
}

export function createConsultationRepository(
  db: Database,
): ConsultationRepository {
  return {
    async create(consultation) {
      await db.insert(consultations).values({
        id: consultation.id,
        initialContent: consultation.initialContent,
        status: consultation.status,
      });
    },
  };
}
```

interface と実装を別ファイルへ分けること自体を禁止しないが、分割のためだけに `Impl` や ORM / DB 製品名を持つ実装ファイルを追加しない。変更理由や責務が実際に分かれる場合にのみ分割する。

### 2. DB アクセスには Drizzle ORM を利用する

D1 への SQL 発行と型マッピングには Drizzle ORM を利用する。

feature 側は D1 の `prepare()` / `bind()` / `run()` を直接呼ばず、`repository.ts` から共通 DB オブジェクト経由で Drizzle を利用する。

### 3. D1 binding と Drizzle 初期化は shared に閉じ込める

共通 DB 接続は次のように配置する。

```text
backend/src/shared/database/
├── db.ts
└── schema/
    └── <table>.ts
```

- `db.ts` は `D1Database` binding を受け取り、Drizzle の DB オブジェクトを生成する。
- `schema/` は Drizzle のテーブル schema を保持する。
- feature の command / domain は `D1Database` を直接知らない。

初期化と利用の関係は次の形とする。

```text
Cloudflare D1 binding
        ↓
shared/database/db.ts
  drizzle(env.DB)
        ↓
Drizzle DB object
        ↓
feature repository.ts
        ↓
Command / Domain から利用
```

HTTP 入口側では Hono route が `c.env.DB` を共通 DB factory へ渡して DB object と repository を組み立てる。DB 接続技術を command / domain へ流出させない。

### 4. ORM と Repository の責務を分ける

- Repository は、業務側から永続化処理の詳細を隠す feature 境界である。
- Drizzle は、SQL 生成・型マッピング・DB driver 連携を担う ORM / query layer である。
- ORM を採用しても DB 製品差が完全になくなるわけではないため、feature の command / domain から DB 接続を直接扱わない構成は維持する。

## Alternatives considered

### `d1-<feature>-repository.ts`

採用しない。永続化技術名が feature のファイル構造へ露出し、DB 製品変更時に業務責務と無関係な命名変更が発生する。

### `drizzle-<feature>-repository.ts`

採用しない。Drizzle は永続化実装の手段であり、feature の責務名ではない。すべての repository 名へ ORM 名を付ける構造は、実装技術をアーキテクチャ上の主語にしてしまう。

### `ports/` / `persistence/` / `adapters/` を追加する

採用しない。既存 Hono Profile は Feature-oriented Vertical Slice Architecture を採用しており、`repository.ts` で永続化境界を表現できる。別のアーキテクチャ語彙を追加せず、変更理由が同じコードを feature 内へ凝集させる。

### `XxxRepositoryImpl` を作る

採用しない。TypeScript の構造的型付けでは、Java の実装クラス命名をそのまま再現する必要はない。実装クラス名ではなく、feature 内の配置と exported contract で責務を示す。

## Consequences

- feature のディレクトリ構造が DB 製品や ORM 名に引きずられない。
- D1 binding と Drizzle 初期化を shared database 層へ限定できる。
- PostgreSQL 等へ移行する場合も、command / domain の変更を避けやすい。
- Drizzle schema と migration の整合性を保つ必要がある。
- DB 固有機能を利用する場合は、その依存を repository または shared database 層に閉じ込め、設計判断として明示する。

## Related documents

- `.agents/profiles/hono/architecture-rules.md`
- `.agents/profiles/cloudflare/workers-d1-r2-rules.md`
- `docs/specs/F001-consultation-start/design.md`
