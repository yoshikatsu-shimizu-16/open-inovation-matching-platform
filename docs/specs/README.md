# docs/specs/

このディレクトリには、全体要件とconstitutionのレビュー後に作る**機能別SPEC**を置く。
手法・EARS記法・Skillの説明は `.agents/sdd/README.md` を参照する。

## 構造

```text
docs/specs/<feature-slug>/
├── requirements.md   # sdd-specify の出力
├── design.md         # sdd-plan の出力
├── tasks.md          # sdd-tasks の出力
└── progress.md       # 実装中の進捗・決定・handoff（必要な場合）
```

Skillのcanonical実体は `.agents/skills/sdd-*/SKILL.md` にある。
Claude Code向け互換層は `.claude/skills/sdd-*/SKILL.md` に置く。
詳細は `.agents/sdd/README.md` の「Skills」節を参照する。

`<feature-slug>`は機能を表す短いkebab-case名（例: `docs/specs/user-notifications/`）。
各requirementsは全体要件台帳のFR/NFRを `## Parent requirements` に記し、台帳の「対応SPEC」欄からも逆引きできるようにする。詳細要求の `REQ-001` などは機能ディレクトリ内で採番する。

現在のspec:

- `hono-backend-boilerplate/`: Hono backendのreference implementation
- `cloudflare-runtime/`: Workers、D1、R2、Terraform、runtime verification

上記2件は全体要件導入前のスターター雛形用SPECであり、Harnessの移行例外とする。新しいアプリ機能SPECには、全体要件とconstitutionのレビューを必須とする。

## Boundary

- SDDを**どう実行するか**: `.agents/sdd/` / `.agents/skills/`
- SDDで**何を決めたか**: `docs/specs/`

Agentの方法論と、プロジェクトの仕様成果物を混在させない。

## 関連

- 手法: `.agents/sdd/README.md`
- プロジェクト全体の不可侵原則: `.agents/sdd/constitution.md`
- プロジェクト全体の機能・非機能要件と進捗: `docs/project-requirements.md`
- ユーザー可視の振る舞いを持たない複雑作業: `docs/exec-plans/`
