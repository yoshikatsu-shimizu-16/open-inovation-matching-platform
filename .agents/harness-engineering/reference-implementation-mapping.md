# Public Harness Reference Mapping

公開一次資料から、dev-standard-kitへ具体的に取り込んだ要素を対応付ける。

## OpenAI Harness Engineering

Source: https://openai.com/index/harness-engineering/

取り込み:

- 短い `AGENTS.md` を目次として使う
- `ARCHITECTURE.md` をトップレベルの構造地図として置く
- 構造化された repository-local docs を system of record とする
- execution plan をversion管理する
- architecture boundary を custom lint / structural test で機械的に守る
- 人間のレビュー指摘や失敗を docs / lint / tests に昇格する
- UI、logs、metrics、tracesなどをagentから検証可能にする

対応:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/design-docs/`
- `docs/exec-plans/`
- `.agents/harness-engineering/harness-lifecycle.md`
- `.agents/scripts/harness/checks/knowledge-base-check.sh`
- `.agents/scripts/harness/harness-verify-orchestrator.sh`

## OpenAI Symphony

Source: https://openai.com/index/open-source-codex-orchestration-symphony/

取り込み:

- repository-owned `WORKFLOW.md`
- workflow policy / config / coordination / execution / observability の分離
- 1タスクごとの独立workspaceという考え方
- retry/recoveryとhandoff stateをworkflowの一部として扱う
- agentの成功を必ずしもDoneにせずHuman Reviewへ渡せる

対応:

- `WORKFLOW.md`
- `.agents/templates/WORKFLOW.md`

## Anthropic Effective Harnesses for Long-Running Agents

Source: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

取り込み:

- initializer phase と coding phase を分ける
- `init.sh` で起動方法を固定する
- structured feature list をJSONで管理する
- feature listの完了状態以外をcoding agentが勝手に書き換えない
- 一度に1機能ずつ進める
- progress artifact + git historyでセッション間を引き継ぐ
- セッション開始時にbaseline smoke testを行う
- browser automationによるE2E確認後に完了扱いにする

対応:

- `.agents/templates/long-running-agent/init.sh`
- `.agents/templates/long-running-agent/feature-list.json`
- `.agents/templates/long-running-agent/progress.md`
- `.agents/templates/long-running-agent/SESSION_PROTOCOL.md`

## Anthropic Harness Design for Long-Running Application Development

Source: https://www.anthropic.com/engineering/harness-design-long-running-apps

取り込み:

- planner / generator / evaluator の責務分離
- 大きなbuildを小さく検証可能なchunkに分解する
- structured artifactでhandoffする
- harness componentはモデル能力への仮定なので、定期的に必要性を再評価する

対応:

- `.agents/harness-engineering/harness-lifecycle.md`
- `docs/exec-plans/`

## Anthropic Managed Agents

Source: https://www.anthropic.com/engineering/managed-agents

取り込み:

- harness、session、sandboxを分離して考える
- モデル改善により不要になったscaffoldingを削除する
- harnessを永続的な真理ではなくversioned assumptionとして管理する

対応:

- `.agents/harness-engineering/harness-lifecycle.md`

## Cloudflare

Workers testing:
https://developers.cloudflare.com/workers/testing/vitest-integration/

D1 local development:
https://developers.cloudflare.com/d1/best-practices/local-development/

取り込み:

- Workers runtimeに近いテスト
- D1/R2 binding込みintegration test
- local migration verification
- production resourceに触らず検証する境界

対応:

- `.agents/profiles/cloudflare/`
- `.agents/harness-engineering/verification-matrix.md`
- `npm run harness:verify` (`.agents/scripts/harness/harness-verify-orchestrator.sh`)

## AWS Kiro

Source: https://kiro.dev/docs/specs/ , https://kiro.dev/docs/specs/best-practices/ , https://kiro.dev/docs/steering/

取り込み:

- `requirements.md`(EARS記法) → `design.md` → `tasks.md` という3段階、各段階でレビュー・承認してから次へ進む
- `steering`(プロジェクト全体で永続する技術スタック・規約)と`specs`(機能ごと)の2階層分離

対応:

- `.agents/sdd/README.md`
- `.agents/sdd/constitution.md`
- `.agents/sdd/templates/{requirements,design,tasks}.template.md`

## GitHub Spec Kit

Source: https://github.com/github/spec-kit , https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

取り込み:

- `project requirements`(FR/NFR台帳) → `constitution`(共通原則) → `specify` → `plan` → `tasks` → `analyze`(整合性ゲート、read-only) → `implement`
- `/specs/<feature>/`というper-feature ディレクトリ規約
- specをスキル(実行手順+出力先の明示)として構造化する考え方
- `analyze`ゲートのうち機械的に判定できる部分(レビュー完了・要求ID・traceability・検証フィールドの有無)はスクリプトで強制する

対応:

- `.agents/sdd/constitution.md`
- `docs/project-requirements.md`（フォーク先で作成する全体要件）
- `.agents/skills/sdd-{project-requirements,constitution}/SKILL.md`
- `.agents/skills/sdd-{specify,plan,tasks,analyze}/SKILL.md`(実体)
- `.claude/skills/sdd-{specify,plan,tasks,analyze}/SKILL.md`(Claude Code用転送)
- `docs/specs/README.md`
- `.agents/scripts/harness/checks/spec-check.sh` (`harness:verify` 内部)

## Agent Skills open standard

Source: https://agentskills.io/

取り込み:

- SKILL.md(YAML frontmatterの`name`/`description` + 本文)というcross-agentな形式
- 各agentが実際にスキャンするディレクトリ規約(Claude Codeは`.claude/skills/`、Codex等は`.agents/skills/`)へ実体を置く
- 複数ディレクトリへ実体を重複させないためのforwarding file pattern

対応:

- `.agents/skills/sdd-{specify,plan,tasks,analyze}/SKILL.md`(実体)
- `.claude/skills/sdd-{specify,plan,tasks,analyze}/SKILL.md`(転送)
- `.agents/sdd/README.md`「Skills」節

## Anthropic Claude Code (Spec-Driven Development)

Source: https://code.claude.com/docs/en/best-practices

取り込み:

- Explore → Plan → Implement → Commit という標準ループ
- specをコードより先に書くsource of truthとして扱う

対応:

- `.agents/sdd/README.md`
- `AGENTS.md`

## Loop Engineering

Source: https://addyosmani.com/blog/loop-engineering/ , https://arxiv.org/html/2607.00038v1

取り込み:

- harness(環境) → loop contract(完了/停止条件) → state layer(状態) → checker(自動検証) → human checkpoint(人間承認)という5層モデル
- automations/worktrees/skills/connectors/sub-agents/external stateというloopの解剖図

対応:

- `.agents/loop-engineering/README.md`
- `.agents/loop-engineering/loop-contract.template.md`
- `.agents/templates/long-running-agent/SESSION_PROTOCOL.md`

## Repository boundary adopted by dev-standard-kit

OpenAI / Anthropicの公開資料は「HarnessやLoopを必ず`.agents/`へ置く」というディレクトリ規約を定めているわけではない。
このkitでは、彼らの設計思想をFork-first starterへ適用するため、**Agentの制御層を`.agents/`へ集約し、アプリコード・テスト・CI・人間向けspec成果物は通常のrepository領域へ残す**という境界を採用する。

## 方針

一次資料の仕組みを無条件にコピーしない。各要素には「どの失敗を防ぐためのものか」を持たせ、実プロジェクトで有効性を確認する。不要になったハーネスは削除・簡素化する。
