# Spec-Driven Development (SDD)

## Purpose

コードではなく、specを実装のsource of truthにする。
仕様をコードより先に書き、version管理し、実装前にreview・整合性チェックを通してからコードを生成する。

参考:
- AWS Kiro: https://kiro.dev/docs/specs/ , https://kiro.dev/docs/specs/best-practices/
- GitHub Spec Kit: https://github.com/github/spec-kit
- Anthropic Claude Code Best Practices: https://code.claude.com/docs/en/best-practices

## Pipeline

```text
project requirements (全体要件・FR/NFR台帳) → review PR → human merge
   ↓
constitution (共通原則) → review PR → human merge
   ↓
user flow選択 → [optional HTML mockでイメージ合わせ] → vertical slice選択 [human confirms scope/business decisions]
   ↓
requirements(EARS: selected slice only) → review PR → human merge
   ↓
design → review PR → human merge
   ↓
tasks → review PR → human merge
   ↓
analyze(整合性ゲート)
   ↓
implement
```

HTMLモックは必要な場合だけ作る。利用者の流れや情報提示を具体的に話し合うための仮説であり、正解、承認済み要件、技術設計、受入条件の代わりにはならない。モックから出た意見は人間が業務判断・仮説・未決事項に分け、AIが推測で決定しない。独立Skill `.agents/skills/mockup/SKILL.md` を利用できる。

機能別SPECは初期版全体を一括で詳細化せず、人間が選んだ一つの縦切りに限定する。複数FR/NFRが関係する場合は対応関係を保ちつつ、そのループで実装・受入できる範囲だけを扱う。大きすぎる場合は独立して受け入れ可能な縦切りへ分割する。

## Human Review と証跡

SDD成果物の正式な人間承認は、対象成果物をレビューするPull Requestを人間がMergeする操作とする。Markdown内のReview情報は承認操作そのものではなく、GitHub上のMerge事実をローカルでも検証できる形へ同期した証跡である。

レビュー前の成果物は次のmetadataを持つ。

```markdown
## Review

- Status: pending
- Evidence: —
- Reviewed at: —
- Reviewed by: —
```

Merge後は `.github/workflows/sdd-review-evidence.yml` が変更されたSDD成果物を検出し、次のように更新する。

```markdown
## Review

- Status: reviewed
- Evidence: PR #123
- Reviewed at: 2026-09-26T10:49:33.000Z
- Reviewed by: @reviewer
```

- Agentは自身の判断で `Status: reviewed` に変更しない。
- レビュー済み成果物を実質変更する場合は、変更PR内で `Status: pending` に戻し、既存Evidenceを `—` にして再レビューを要求する。
- HarnessはReview metadataと工程順序をローカルファイルだけで検証する。通常のHarness実行時にGitHub APIへ依存しない。
- 既存forkの移行互換性として旧 `- [x] レビュー済み` は読み取り可能だが、新規・更新成果物ではmetadataを使用する。

## SDDとV字モデルの対応関係

このkitでは、**プロジェクト全体の要件と原則**、**機能ごとに繰り返す仕様**を分ける。

| V字モデルの工程 | このkitでの対応 | 頻度 |
|---|---|---|
| 全体要件定義 | `docs/project-requirements.md` | プロジェクトに1つ、変更時は改訂 |
| 共通原則 | `docs/constitution.md` | プロジェクトに1つ、変更時は影響確認と再レビュー |
| 利用者フローのイメージ合わせ | 任意の簡易HTMLモック | 次の縦切りを選ぶ時に必要なら実施。要件や設計の正解とはみなさない |
| 詳細設計〜実装計画 | `docs/specs/<feature>/{requirements,design,tasks}.md` | 人間が選んだ縦切りごとに繰り返す |
| 実装 | 通常の実装作業(1タスク単位は`.agents/harness-engineering/task-contract-template.md`を併用) | tasks.mdの各項目ごと |
| 単体テスト | `.agents/harness-engineering/quality-gates.md` Gate 1-2。requirements.mdのacceptance criteria(EARS)をテストへ変換する | tasksの実装ごと |
| 結合・総合テスト | `.agents/harness-engineering/quality-gates.md` Gate 3-7、`.agents/harness-engineering/verification-matrix.md` | 機能ごと |
| UAT | 人間によるビジネス受け入れレビュー(`.agents/standards/ai-development-rules.md`の承認境界、`analyze`ゲートの先) | 機能ごと、人間判断 |

**SDDは新しいテスト工程を定義しない。** 単体〜UATは既存の`.agents/harness-engineering/quality-gates.md`・`.agents/harness-engineering/verification-matrix.md`が担当する。SDDが追加するのは、詳細設計〜実装計画を機能単位で高速に回すための型と、実装前に仕様の整合性を確認するゲートである。

## EARS記法 早見表

requirements.mdの各要求は、曖昧な自然文ではなく EARS (Easy Approach to Requirements Syntax, Mavin et al., IEEE RE'09) で書く。

| パターン | 構文 |
|---|---|
| Ubiquitous(常時) | THE SYSTEM SHALL <response> |
| Event-Driven(イベント駆動) | WHEN <trigger> THE SYSTEM SHALL <response> |
| State-Driven(状態駆動) | WHILE <state> THE SYSTEM SHALL <response> |
| Unwanted Behavior(異常系) | IF <condition> THEN THE SYSTEM SHALL <response> |
| Optional Feature(任意機能) | WHERE <feature is present> THE SYSTEM SHALL <response> |

### requirements.mdでの可読性ルール

EARSの英語キーワードは構文を示す**ラベル**として残すが、日本語本文の途中には埋め込まない。人間レビューでは、条件・状態・システム応答が区別できるよう別行で記述する。

```markdown
- [ ] REQ-001
  - WHEN: 相談開始画面を表示する
  - THE SYSTEM SHALL: 相談内容を自由記述できる入力欄を表示する

- [ ] REQ-002
  - IF: 相談内容が未入力である
  - THEN THE SYSTEM SHALL: 入力が必要であることを表示する
```

この表記はEARSの意味を変えるものではなく、`WHEN ... THE SYSTEM SHALL ...` 等の構文要素を視覚的に分離したものである。

## ディレクトリ規約

- `.agents/sdd/`: SDDの手法、templates・このREADMEを持つ。
- `docs/project-requirements.md`: 全体要件、FR/NFR台帳、対応状態（フォーク先で作成する）。
- `docs/constitution.md`: 全機能に共通するプロジェクト固有の原則。
- `.agents/skills/sdd-*/`: AgentがSDDを実行するcanonical Skill。
- `docs/specs/<feature>/`: specify/plan/tasksの出力先。1機能につき1ディレクトリ。

SDDの実行方法は `.agents/`、全体要件・constitution・機能別成果物は `docs/` に置く。constitutionはプロジェクトに1つ置き、人間がレビューする。

## 既存の仕組みとの役割分担

| 仕組み | 用途 |
|---|---|
| `.agents/harness-engineering/task-contract-template.md` | 単一セッションで完結する小タスク。`tasks.md`の1項目を実装する単位にも使う |
| `docs/exec-plans/` | ユーザー可視の振る舞いを持たない複雑作業(リファクタ・依存更新・infra変更) |
| `.agents/sdd/` → `docs/specs/` | ユーザー可視の振る舞いや契約変更を伴う機能追加 |

## Skills

スキルは[Agent Skills open standard](https://agentskills.io/)のSKILL.md形式に従い、各agentが実際に自動発見する場所に置く。

| Skill | 出力 | 実体 |
|---|---|---|
| `sdd-project-requirements` | `docs/project-requirements.md` | `.agents/skills/sdd-project-requirements/SKILL.md` |
| `mockup` | 一時的な簡易HTMLモックと説明 | `.agents/skills/mockup/SKILL.md` |
| `sdd-constitution` | `docs/constitution.md` | `.agents/skills/sdd-constitution/SKILL.md` |
| `sdd-specify` | `docs/specs/<feature>/requirements.md` | `.agents/skills/sdd-specify/SKILL.md` |
| `sdd-plan` | `docs/specs/<feature>/design.md` | `.agents/skills/sdd-plan/SKILL.md` |
| `sdd-tasks` | `docs/specs/<feature>/tasks.md` | `.agents/skills/sdd-tasks/SKILL.md` |
| `sdd-analyze` | なし(read-only整合性チェック、PASS/FAILレポートのみ) | `.agents/skills/sdd-analyze/SKILL.md` |

- `.agents/skills/sdd-*/SKILL.md`: canonical。
- `.claude/skills/sdd-*/SKILL.md`: Claude Code用の転送ファイル。本文はcanonical Skillを読む指示に留める。

`sdd-analyze`はまず `npm run harness:verify` を実行する。Harness内部のspec checkerがレビュー未完了・要求ID(`REQ-001`等)の欠落・要求↔タスクのtraceability漏れ・タスクの`checks`フィールド欠落を機械的に検出し、これらが揃って初めてセマンティックな整合性確認へ進む。

## 参考文献

- AWS Kiro Docs: https://kiro.dev/docs/specs/ , https://kiro.dev/docs/specs/best-practices/
- GitHub Spec Kit: https://github.com/github/spec-kit
- Anthropic Claude Code Best Practices: https://code.claude.com/docs/en/best-practices
- EARS: https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax
- Agent Skills open standard: https://agentskills.io/

詳細な対応関係は `.agents/harness-engineering/reference-implementation-mapping.md` を参照する。
