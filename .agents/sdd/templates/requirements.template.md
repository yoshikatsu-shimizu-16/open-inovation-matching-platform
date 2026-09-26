# Requirements: <feature>

> 出力元: `sdd-specify` スキル(`.agents/skills/sdd-specify/SKILL.md`)
> Feature ID: `<feature-id>`
> Feature slug: `<feature-slug>`
> 出力先: `docs/specs/<feature-id>-<feature-slug>/requirements.md`

## Parent requirements

`docs/project-requirements.md` の対応元IDを明記する（例: `FR-001`, `NFR-001`）。全体要件台帳の「対応SPEC」欄にもFeature IDを含む完全なディレクトリ名を記す。

## Overview

何のための機能か、1〜3文で書く。

## User stories

User Storyは英語の定型句を文章中へ埋め込まず、人間レビューで役割・要望・目的を区別しやすい項目形式で書く。

### User Story 1

- 利用者: <role>
- やりたいこと: <capability>
- 目的: <benefit>

## Requirements (EARS)

EARS記法(`.agents/sdd/README.md`の早見表を参照)で書く。各要求には`REQ-001`のような安定したIDを付け、`design.md`のtraceability表・`tasks.md`の`verifies`フィールドから参照する。IDは一度付けたら変更しない。

EARSの英語キーワードは文章本文ではなく構文ラベルとして扱い、日本語の条件・状態・応答と別項目に分ける。`WHEN ... THE SYSTEM SHALL ...` のように一つの文へ混在させない。

- [ ] REQ-001
  - WHEN: <event>
  - THE SYSTEM SHALL: <response>

- [ ] REQ-002
  - IF: <condition>
  - THEN THE SYSTEM SHALL: <response>

- [ ] REQ-003
  - WHILE: <state>
  - THE SYSTEM SHALL: <response>

## Out of scope

この機能で対応しないもの。

## Constitution alignment

`docs/constitution.md`のどの原則に関連するか、矛盾しないかを記す。

## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
