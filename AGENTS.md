# AGENTS.md

## Purpose

このリポジトリは、**個人開発アプリを作るためのフォーク元スターター**として使う。
フォーク後は、要件・仕様を先に固め、その内容に従って `frontend/`・`backend/`・`infrastructure/` の雛形から実アプリを構築していく。

AI Coding Agent の制御・開発標準・Harness Engineering・Loop Engineering・SDDの実行方法は、原則として **`.agents/` 配下に閉じ込める**。
人間が日常的に意識するトップレベルは、アプリ領域と `docs/` を中心にする。

`AGENTS.md` は詳細ルールの百科事典ではなく、AIが必要な source of truth へ到達するための短いナビゲーションマップとして維持する。

## Default operating mode

通常は **Application Development Mode** で作業する。

- アプリのコードは `frontend/`・`backend/`・`infrastructure/` に置く。
- 要件・設計・実装計画など、人間と共有する成果物は `docs/` に置く。
- Agent内部の標準・Harness Engineering・Loop Engineering・Skill・template・checker は `.agents/` に置く。
- 開発標準そのものを変更する場合だけ **Kit Maintenance Mode** とし、`docs/maintainers/dev-standard-kit-maintenance.md` を読む。
- ユーザーから明示されていない限り、アプリ機能の実装中に `.agents/` の標準やHarnessを都合よく緩めない。

## Default starter profiles

フォーク直後の標準構成は次を前提とする。

- Frontend: React + Vite + TypeScript
- Backend: Hono
- Runtime / Infrastructure: Cloudflare Workers
- Database: Cloudflare D1
- Object Storage: Cloudflare R2

実プロジェクトで技術を変更する場合は、`docs/constitution.md` と該当する `.agents/profiles/` を更新し、変更理由を設計判断として残す。

## Read first

1. `ARCHITECTURE.md` — アプリ領域と `.agents/` の境界
2. `WORKFLOW.md` — Fork後の標準開発フロー
3. `.agents/README.md` — AI開発基盤の入口
4. `docs/project-requirements.md` — フォーク先アプリの全体要件・FR/NFR台帳（作成後）
5. `docs/constitution.md` — 全機能に共通する原則（全体要件のレビュー後に確定）
6. `docs/specs/` — 機能ごとの requirements / design / tasks
7. `.agents/sdd/` — SDDの実行方法とテンプレート
8. `.agents/standards/` — 技術非依存の共通ルール
9. `.agents/harness-engineering/` — task contract、quality gates、verification、lifecycle
10. `.agents/profiles/` — React / Hono / Cloudflare 等の技術固有ルール
11. `.agents/loop-engineering/` — 長時間・自律実行のloop contract
12. `docs/design-docs/` — 設計判断とcore beliefs
13. `docs/exec-plans/` — 長時間・複雑作業のexecution plan

## Application areas

フォーク先アプリでは、次の3領域を実装の基本境界とする。

- `frontend/`: UI、画面状態、ブラウザ側API client、フロントエンドテスト
- `backend/`: API、business logic、repository、storage access、バックエンドテスト
- `infrastructure/`: Cloudflare設定、D1 migration、R2 binding、deploy/runtime設定など

これらの雛形コードは後続Issueで整備する。存在しない段階でも、この3ディレクトリ名はアプリ実装領域として予約する。

## Operating model

- Humans define intent, priorities, acceptance criteria, and risk boundaries.
- Agents convert intent into versioned specifications before implementation when behavior or contracts change.
- Agents execute within repository-owned rules and verification gates.
- 大きな変更は小さく検証可能な単位へ分解する。
- 完了は自己申告ではなく verification evidence で判断する。
- セッションをまたぐ作業は durable artifacts で引き継ぐ。

## Repository rules

- アプリ実装とAI開発基盤を混在させない。
- 技術固有の制約は `.agents/profiles/<technology>/` に置く。
- ユーザー可視の振る舞い、API契約、データ契約を変更する機能は SDD を先に通す。
- 同種の失敗が繰り返されたら lint / test / checker / CI / architecture rule のいずれかへ昇格することを検討する。
- 実行可能な品質ゲートは文章だけでなく `.agents/scripts/` に落とす。
- secret、credential、production resource ID をコード・spec・exampleへ埋め込まない。
- Harnessは増やし続けず、不要になったscaffoldingを定期的に見直す。

## Before work

1. Application Development Mode か Kit Maintenance Mode かを判定する。通常は前者。
2. `git status` と最近の履歴を確認する。
3. 全体要件、`docs/constitution.md` と関係する既存specを読む。アプリの機能別SPECより先に全体要件とconstitutionを人間がレビューする。
4. ユーザー可視の振る舞い、API契約、データ契約を変更する場合は、実装より先に `docs/specs/<feature>/` の requirements → design → tasks → analyze を進める。
5. 実装対象を `frontend/`・`backend/`・`infrastructure/` のどこに置くか決める。
6. acceptance criteria と verification を決める。
7. ユーザー可視の振る舞いを持たない複雑な作業は `docs/exec-plans/template.md` を使う。
8. 長時間・自律実行では `.agents/loop-engineering/loop-contract.template.md` と `.agents/templates/long-running-agent/` のsession protocolを使う。

## Completion

- `.agents/harness-engineering/verification-matrix.md` に従って変更対象の検証内容を確認する。
- **完了前は `npm run harness:verify` を必ず実行し、これをHarnessの唯一の公開入口とする。**
- 完了報告には変更ファイル、実行した検証、PASS/FAIL、未検証事項、残課題を含める。
- spec駆動の変更では、実装後も `docs/specs/<feature>/` とコードが同期していることを確認する。

## Kit maintenance

`dev-standard-kit` 自身の開発標準、テンプレート、Harness、Agent Skillを改善するタスクは通常のアプリ開発とは分離する。
その場合のみ `docs/maintainers/dev-standard-kit-maintenance.md` を読み、`.agents/` の設計原則と互換性を保って変更する。
