# AI Development System

`.agents/` は、このstarterで AI Coding Agent を動かすための内部開発基盤をまとめる領域です。

通常のアプリ開発では、ここを直接編集する必要はありません。人間が主に扱うのは `frontend/`、`backend/`、`infrastructure/`、`docs/` です。

## Structure

```text
.agents/
├── skills/                 # Codex等が発見するcanonical skills
├── sdd/                    # SDD method / templates
├── standards/              # 技術非依存の共通ルール
├── profiles/               # React / Hono / Cloudflare等の技術固有ルール
├── harness-engineering/    # quality gates / verification matrix / task contract
├── loop-engineering/       # long-running agent contract
├── scripts/
│   └── harness/
│       ├── harness-verify-orchestrator.sh  # 唯一のHarness入口 / orchestrator
│       ├── checks/            # internal structural/spec checks
│       └── setup/             # internal bootstrap helpers
├── templates/              # agent support / CI / long-running scaffolding
└── examples/               # reference material
```

## Design boundary

### `.agents/` に置くもの

- Agent Skill
- SDDの進め方とtemplate
- Harness Engineeringの定義とverification rules
- Loop Engineeringのsession/contract
- Agent向けstandards / profiles
- Agentが使うchecker / bootstrap script
- Agent用template / reference

### `.agents/` に置かないもの

- 実アプリのruntime code
- 人間と共有する機能仕様の成果物
- 実アプリのテストコード
- CIそのもの
- deploy対象のconfiguration

これらはそれぞれ `frontend/`、`backend/`、`infrastructure/`、`docs/`、`.github/` に置きます。

## SDD

- 実行方法: `.agents/skills/sdd-*` と `.agents/sdd/`
- 全体要件: `docs/project-requirements.md`（`sdd-project-requirements`で作成）
- 共通原則: `docs/constitution.md`（`sdd-constitution`で作成）
- 機能別成果物: `docs/specs/<feature>/requirements.md`、`design.md`、`tasks.md`

## Harness Engineering

- 定義: `.agents/harness-engineering/`
- 公開実行入口: `npm run harness:verify`
- 実体: `.agents/scripts/harness/harness-verify-orchestrator.sh`
- 内部checker: `.agents/scripts/harness/checks/`
- 検証対象: application code / tests / build / CI

Harness Engineeringの制御資産はAgent側に隠しますが、品質を担保するテストやCIまで隠しません。
内部checkerを個別の公開入口として扱わず、`harness:verify` からorchestrationします。

## Loop Engineering

- Contract: `.agents/loop-engineering/`
- Session scaffolding: `.agents/templates/long-running-agent/`
- Verification: `npm run harness:verify`

Loop Engineeringは複数セッションをまたぐAI作業を安全に再開するための制御層です。

## Compatibility

`.agents/skills/` をcanonicalとします。
Claude Code向けには `.claude/skills/` にforwarding skillを置きます。

## Maintenance

通常のアプリ機能実装中に、このディレクトリを都合よく変更しないでください。
AI開発基盤そのものを改善する場合は Kit Maintenance Mode とし、`docs/maintainers/dev-standard-kit-maintenance.md` を先に読みます。
