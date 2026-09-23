---
name: sdd-specify
description: 全体要件とconstitutionの人間レビュー後、FR/NFRに対応する機能要求をEARS形式のrequirements.mdへ変換する。
---

# Specify

## Output

`docs/specs/<feature-slug>/requirements.md`
(テンプレート: `.agents/sdd/templates/requirements.template.md`)

## When to use

- ユーザー可視の振る舞いや、API/データ契約の変更を伴う新機能に着手する時。
- リファクタ・依存更新・infra変更など、ユーザー向けの振る舞いを持たない作業には使わない
  (`docs/exec-plans/`を使う)。

## Inputs

- 機能の要求(ユーザーからの依頼、Issue等)
- レビュー済みの `docs/project-requirements.md` と対応する `FR/NFR`
- `docs/constitution.md`
- 既存の`docs/specs/`配下に類似機能がないか

## Steps

1. 全体要件とconstitutionのレビュー完了を確認する。未完了なら機能SPECを作らず、対応するスキルへ戻す。
2. 対応元の `FR/NFR` IDを選び、要求台帳の「対応SPEC」欄と仕様側の「Parent requirements」を相互に結ぶ。複数機能に関係するNFRは各SPECから参照する。
3. `docs/specs/<feature-slug>/`ディレクトリを作る(`<feature-slug>`は機能を表す短いkebab-case名)。
4. `.agents/sdd/templates/requirements.template.md`を
   `docs/specs/<feature-slug>/requirements.md`へコピーする。
5. Overview、User storiesを埋める。
6. Requirementsを EARS記法(`.agents/sdd/README.md`の早見表)で書く。
   曖昧な自然文のままにしない。各要求に`REQ-001`のような安定したIDを付ける
   (`design.md`のtraceability表・`tasks.md`の`verifies`から参照される)。
7. Out of scopeを明記する。
8. Constitution alignmentで、constitution.mdのどの原則と関連するかを書く。

## Stop condition

- `## Review`のチェックボックスにチェックが入る(人間がレビューする)まで、
  `sdd-plan`スキルへは進まない。

## Boundary

このスキルはrequirements.mdの作成のみを行う。設計(`sdd-plan`)・実装計画(`sdd-tasks`)・
実装は別スキルの責務であり、ここでは行わない。
