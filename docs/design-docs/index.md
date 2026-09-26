# Design Documents Index

このディレクトリは、AIエージェントと人間が共有する設計判断のsystem of recordとする。

## Rules

- 大きな設計判断はチャットや口頭だけで終わらせず、ここへ残す。
- 各design docには status / decision / alternatives / consequences を含める。
- 古くなった文書は削除するか superseded を明示する。
- `AGENTS.md` には詳細を書き込まず、必要な文書への導線だけを置く。

## Documents

- `core-beliefs.md`: agent-first developmentで維持する設計原則
- `backend-persistence-architecture.md`: Hono feature の永続化境界、Drizzle ORM、D1 binding の責務分離
- `open-innovation-ai-hypothesis-principles.md`: AI仮説と確認済み事実を分離するプロダクト設計原則

参考: https://openai.com/index/harness-engineering/
