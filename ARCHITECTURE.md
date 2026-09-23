# Architecture

このリポジトリは、**フォークした後に個人アプリを構築するためのスターター**として設計する。
AI Coding Agent が短時間で「どこにアプリを書き、どこに仕様を書き、どこにAI開発基盤があるか」を把握できることを最優先にする。

## Two zones

リポジトリを大きく2つの領域に分ける。

### 1. Application workspace

実際のアプリを構築する領域。

```text
frontend/        # UI / browser-side application
backend/         # API / business logic / data access
infrastructure/  # runtime / database / storage / deployment configuration
docs/            # 人間と共有する仕様・設計判断・実行計画
```

フォーク後は、まず要件・仕様を固め、そのspecに従って各ディレクトリの雛形からアプリを育てる。
これらの雛形コード自体は後続Issueで追加する。Issue #3ではトップレベルの責務と境界を先に固定する。

### 2. AI development system

アプリをAIと安全・再現可能に開発するための制御層。原則として `.agents/` に閉じ込める。

```text
.agents/
├── README.md                 # AI開発基盤の入口
├── skills/                   # Codex等が発見するcanonical skills
├── sdd/                      # constitution / SDD method / templates
├── standards/                # technology-independent rules
├── profiles/                 # technology-specific constraints
├── harness-engineering/      # quality gates / verification / task contract / lifecycle
├── loop-engineering/         # long-running execution contract
├── scripts/                  # bootstrap / verify / knowledge checks
├── templates/                # reusable agent support artifacts
└── examples/                 # AI向けreference material

.claude/
└── skills/                   # Claude Code compatibility / forwarding
```

`.agents/` はアプリのruntimeコードではない。
アプリ機能の都合だけで標準側を書き換えず、繰り返す失敗や新しい共通ルールが見つかった場合にのみ改善対象とする。

## Target repository shape

フォーク先で目指すトップレベル構成は次の通り。

```text
<forked-project>/
├── frontend/                 # frontend scaffold → application code
├── backend/                  # backend scaffold → application code
├── infrastructure/           # infrastructure scaffold → application config
├── docs/
│   ├── specs/                # feature requirements / design / tasks
│   ├── design-docs/          # durable design decisions
│   ├── exec-plans/           # complex non-feature work
│   └── maintainers/          # starter自体を保守する場合のみ参照
├── .agents/                  # AI development system
├── .claude/                  # Claude Code compatibility
├── .github/                  # CI / repository automation
├── AGENTS.md                 # short navigation map
├── ARCHITECTURE.md
└── WORKFLOW.md
```

ルートに Harness / Loop / standards / profiles / templates / agent scripts を散在させない。
人間が通常のアプリ開発で目にするトップレベルをできるだけ小さく保つ。

## Application boundaries

### frontend/

- React等のUI実装
- routing / state / component / browser-side API client
- frontend unit test / browser E2E
- backend内部実装やCloudflare resource設定を直接持ち込まない

### backend/

- Hono等のHTTP/API entrypoint
- business logic
- repositories / storage adapters
- validation / authorization
- frontend UIロジックを持ち込まない

### infrastructure/

- Cloudflare Workers / D1 / R2等のruntime設定
- migration / binding / deployment configuration
- local / preview / production environment差分
- credentialそのものは保持しない

frontendとbackend間の契約、backendとinfrastructure間のruntime契約は、実装より先にspec/designで明示する。

## SDD boundary

SDDは「実行方法」と「成果物」を分離する。

- AgentがSDDをどう進めるか: `.agents/skills/` と `.agents/sdd/`
- 人間とAgentが共有する機能仕様: `docs/specs/<feature>/`

つまり、SDDの仕組みはAgent側に隠し、requirements / design / tasksという成果物は通常のドキュメントとして見える状態にする。

## Harness Engineering boundary

Harness Engineeringも同様に二層で扱う。

- Harness定義・quality gate・verification matrix・checker: `.agents/harness-engineering/` / `.agents/scripts/`
- 実際に検証される対象: `frontend/` / `backend/` / `infrastructure/` / tests / build / CI

Harness Engineeringの制御資産は隠してよいが、品質を強制するテストやCIまで隠さない。

## Loop Engineering boundary

Loop Engineeringの制御層は `.agents/loop-engineering/` と `.agents/templates/long-running-agent/` に置く。
進捗・feature state・session protocol等はAgentの長時間実行を支えるための内部資産として扱う。

ただし、Loopが変更するアプリコードと、完了判断に使うテスト・CIはApplication workspace側の通常資産である。

## Development flow

```text
Fork
  ↓
Project requirements (FR/NFR) / human review
  ↓
Constitution / human review
  ↓
Feature requirements
  ↓
Design
  ↓
Implementation tasks
  ↓
frontend / backend / infrastructure
  ↓
.agents/harness-engineering + verification scripts
  ↓
Evidence-based handoff
  ↓
必要なら .agents/loop-engineering で継続
```

仕様が実装領域より先に存在することを基本とする。
「まずコードを生成して後から仕様を合わせる」を標準フローにはしない。

## Dependency direction

- `.agents/standards/` は特定技術に依存しない。
- `.agents/profiles/` は技術固有の制約だけを持つ。
- `.agents/harness-engineering/` は standards / profiles を検証可能なquality gateへ落とす。
- `.agents/sdd/` と `.agents/skills/` は機能要求から実装計画までを型化する。
- `docs/project-requirements.md` は全体要件と対応状態、`docs/specs/` は機能別仕様のsource of truthとなる。
- `frontend/`・`backend/`・`infrastructure/` はspec/designに従って変更する。
- `.agents/scripts/` はAI開発基盤の重要な不変条件を可能な限り機械的に検証する。
- `.agents/examples/` は参考資料であり、アプリ仕様や標準のsource of truthにはしない。

## Kit maintenance boundary

通常のフォーク先開発では、主に Application workspace と `docs/` を変更する。

`.agents/standards/`、`.agents/harness-engineering/`、`.agents/profiles/`、`.agents/templates/`、Agent Skills 等の仕組みそのものを変更する場合は **Kit Maintenance Mode** とする。
保守方針は `docs/maintainers/dev-standard-kit-maintenance.md` をsource of truthとする。

## Design principle

ドキュメントだけで守らせず、重要な不変条件は lint / structural test / checker / CI に昇格する。
一方で、アプリ固有ルールと再利用可能なAI開発基盤を混同しない。
