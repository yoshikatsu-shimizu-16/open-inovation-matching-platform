---
name: sdd-specify
description: 全体要件とconstitutionの人間レビュー後、FR/NFRに対応する機能要求をEARS形式のrequirements.mdへ変換する。
---

# Specify

## Output

`docs/specs/<feature-id>-<feature-slug>/requirements.md`

例: `docs/specs/F001-consultation-start/requirements.md`

(テンプレート: `.agents/sdd/templates/requirements.template.md`)

## Feature ID naming rule

- `<feature-id>` は `F001`, `F002`, ... の3桁連番とする。
- Feature ID は「どの順番で機能SPECを仕様化したか」を後から追跡するための不変IDであり、`FR-001` / `NFR-001` などの要求IDとは別系列とする。
- 新しい機能SPECを作るときは、`docs/specs/` 直下の `F[0-9]{3}-*` を確認し、使用済みFeature IDの最大値 + 1を採番する。存在しない場合は `F001` から開始する。
- 一度発行したFeature IDは削除・並べ替え・欠番発生後も再利用しない。後から機能を途中へ追加する場合も既存Feature IDを振り直さず、新しい末尾番号を発行する。
- `<feature-slug>` は今回の縦切りを表す短いkebab-case名とする。名称を見直す場合もFeature IDは維持する。
- ユーザーがFeature IDを明示した場合は、既存の `docs/specs/` と衝突していないことを確認してから使用する。
- 旧形式の番号なしディレクトリが存在する場合、暗黙に番号を付け替えない。移行は明示的な変更として扱い、参照元も同時に更新する。
- `docs/project-requirements.md` の「対応SPEC」欄には、Feature IDを含む完全なディレクトリ名（例: `F001-consultation-start`）を記録する。

## Human-readable requirements format

- User Storyは `As a ... I want ... so that ...` を日本語文章へ混在させず、`利用者` / `やりたいこと` / `目的` の項目に分ける。
- EARSの `WHEN` / `WHILE` / `IF` / `THEN THE SYSTEM SHALL` / `WHERE` / `THE SYSTEM SHALL` は英語の構文ラベルとして残す。
- EARSキーワードと日本語本文を一文に連結せず、条件・状態とシステム応答を別行の項目として表示する。
- 英語キーワードは仕様記法の構造を示すためのラベルであり、利用者が読む説明文は日本語を基本とする。

## When to use

- ユーザー可視の振る舞いや、API/データ契約の変更を伴う新機能に着手する時。
- リファクタ・依存更新・infra変更など、ユーザー向けの振る舞いを持たない作業には使わない
  (`docs/exec-plans/`を使う)。

## Inputs

- 機能の要求(ユーザーからの依頼、Issue等)
- レビュー済みの `docs/project-requirements.md` と対応する `FR/NFR`
- レビュー済みの `docs/constitution.md`
- 既存の`docs/specs/`配下に類似機能がないか
- 人間が選択した利用者フロー・縦切りの範囲（モックを作った場合、その確認結果と未決事項）

## Steps

1. 全体要件とconstitutionがReview metadataまたは移行互換の既存レビュー証跡でレビュー済みであることを確認する。未完了なら機能SPECを作らず、対応するスキルへ戻す。
2. 今回扱う一つの縦切りを確認する。SPECを段階全体や初期版全体の器にせず、独立して実装・検証・受け入れ可能な利用者価値に絞る。大きすぎる場合は人間へ戻し、次の一機能ループへ分割する。
3. 対応元の `FR/NFR` IDを選び、要求台帳の「対応SPEC」欄と仕様側の「Parent requirements」を相互に結ぶ。今回の縦切りに必要なIDのみ含め、未選択の後続機能は別SPECに残す。複数機能に関係するNFRは各SPECから参照する。
4. モックがある場合も、画面の見た目を要求の根拠や承認とみなさない。画面上の意見を人間が確認した業務判断、仮説、未決事項へ整理し、データ保持・公開・権限などの業務判断は推測で埋めない。
5. `docs/specs/` 直下の既存Feature IDを確認し、Feature ID naming ruleに従って次の `<feature-id>` を決める。
6. `docs/specs/<feature-id>-<feature-slug>/`ディレクトリを作る。
7. `.agents/sdd/templates/requirements.template.md`を `docs/specs/<feature-id>-<feature-slug>/requirements.md`へコピーし、Feature ID・slug・出力先を埋める。
8. Overview、User storiesを埋める。User Storyは `利用者` / `やりたいこと` / `目的` の項目形式にする。
9. Requirementsを EARS記法(`.agents/sdd/README.md`の早見表)で書く。EARSキーワードは構文ラベルとして別行に置き、日本語本文へ埋め込まない。各要求に`REQ-001`のような安定したIDを付ける (`design.md`のtraceability表・`tasks.md`の`verifies`から参照される)。
10. Out of scopeを明記し、後続ループへ送る機能と依存関係を混入させない。
11. Constitution alignmentで、constitution.mdのどの原則と関連するかを書く。
12. `docs/project-requirements.md` の「対応SPEC」欄をFeature ID付きディレクトリ名へ更新し、requirements側のParent requirementsとの相互参照を確認する。
13. requirements.md の `## Review` は `Status: pending` のまま人間レビュー用PRへ出す。既存のレビュー済みrequirementsを実質変更する場合も、再レビューのためmetadataをpendingへ戻す。

## Stop condition

- requirements用PRが人間にMergeされ、`.github/workflows/sdd-review-evidence.yml` により `## Review` が `Status: reviewed`、`Evidence: PR #N` へ同期されるまで `sdd-plan` スキルへは進まない。

## Boundary

このスキルはrequirements.mdの作成のみを行う。設計(`sdd-plan`)・実装計画(`sdd-tasks`)・実装は別スキルの責務であり、ここでは行わない。
