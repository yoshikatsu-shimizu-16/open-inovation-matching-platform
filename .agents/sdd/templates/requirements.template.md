# Requirements: <feature>

> 出力元: `sdd-specify` スキル(`.agents/skills/sdd-specify/SKILL.md`)
> 出力先: `docs/specs/<feature>/requirements.md`

## Parent requirements

`docs/project-requirements.md` の対応元IDを明記する（例: `FR-001`, `NFR-001`）。全体要件台帳の「対応SPEC」欄にもこの機能のディレクトリ名を記す。

## Overview

何のための機能か、1〜3文で書く。

## User stories

- As a <role>, I want <capability>, so that <benefit>.

## Requirements (EARS)

EARS記法(`spec-driven-development/README.md`の早見表を参照)で書く。各要求には
`REQ-001`のような安定したIDを付け、`design.md`のtraceability表・`tasks.md`の
`verifies`フィールドから参照する。IDは一度付けたら変更しない。

- [ ] REQ-001: WHEN <event> THE SYSTEM SHALL <response>
- [ ] REQ-002: IF <condition> THEN THE SYSTEM SHALL <response>
- [ ] REQ-003: WHILE <state> THE SYSTEM SHALL <response>

## Out of scope

この機能で対応しないもの。

## Constitution alignment

`.agents/sdd/constitution.md`のどの原則に関連するか、矛盾しないかを記す。

## Review

- [ ] レビュー済み(この状態になってから `plan` スキルへ進む)
