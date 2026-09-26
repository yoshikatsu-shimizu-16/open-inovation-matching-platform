# Design: <feature>

> 出力元: `sdd-plan` スキル(`.agents/skills/sdd-plan/SKILL.md`)
> 出力先: `docs/specs/<feature>/design.md`
> 入力: `docs/specs/<feature>/requirements.md`(レビュー済みであること)

## Architecture overview

この機能がどのレイヤー・コンポーネントに影響するか。`ARCHITECTURE.md`・
`profiles/<technology>/architecture-rules.md` との整合を確認する。

## Components / Modules

## Data model

変更するスキーマ・型・契約。

## Sequence

主要フローをステップで書く(必要ならASCII図)。

```text
Client -> Route -> Service -> Repository/Storage
```

## Requirements traceability

`requirements.md`の各要求ID(`REQ-001`等)がどう設計に反映されたかを対応付ける。
すべてのIDを漏れなく記載する(`sdd-analyze`スキルが対応漏れを検出する)。

| Requirement | Design element |
|---|---|
| REQ-001 | ... |

## Risks / Alternatives considered

## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
