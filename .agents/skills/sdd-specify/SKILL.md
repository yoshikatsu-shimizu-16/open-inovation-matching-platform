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
- 人間が選択した利用者フロー・縦切りの範囲（モックを作った場合、その確認結果と未決事項）

## Steps

1. 全体要件とconstitutionのレビュー完了を確認する。未完了なら機能SPECを作らず、対応するスキルへ戻す。
2. 今回扱う一つの縦切りを確認する。SPECを段階全体や初期版全体の器にせず、独立して実装・検証・受け入れ可能な利用者価値に絞る。大きすぎる場合は人間へ戻し、次の一機能ループへ分割する。
3. 対応元の `FR/NFR` IDを選び、要求台帳の「対応SPEC」欄と仕様側の「Parent requirements」を相互に結ぶ。今回の縦切りに必要なIDのみ含め、未選択の後続機能は別SPECに残す。複数機能に関係するNFRは各SPECから参照する。
4. モックがある場合も、画面の見た目を要求の根拠や承認とみなさない。画面上の意見を人間が確認した業務判断、仮説、未決事項へ整理し、データ保持・公開・権限などの業務判断は推測で埋めない。
5. `docs/specs/<feature-slug>/`ディレクトリを作る(`<feature-slug>`は今回の縦切りを表す短いkebab-case名)。
6. `.agents/sdd/templates/requirements.template.md`を
   `docs/specs/<feature-slug>/requirements.md`へコピーする。
7. Overview、User storiesを埋める。
8. Requirementsを EARS記法(`.agents/sdd/README.md`の早見表)で書く。
   曖昧な自然文のままにしない。各要求に`REQ-001`のような安定したIDを付ける
   (`design.md`のtraceability表・`tasks.md`の`verifies`から参照される)。
9. Out of scopeを明記し、後続ループへ送る機能と依存関係を混入させない。
10. Constitution alignmentで、constitution.mdのどの原則と関連するかを書く。

## Stop condition

- `## Review`のチェックボックスにチェックが入る(人間がレビューする)まで、
  `sdd-plan`スキルへは進まない。

## Boundary

このスキルはrequirements.mdの作成のみを行う。設計(`sdd-plan`)・実装計画(`sdd-tasks`)・
実装は別スキルの責務であり、ここでは行わない。
