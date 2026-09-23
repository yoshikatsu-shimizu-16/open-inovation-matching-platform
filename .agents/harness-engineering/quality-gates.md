# Quality Gates

通常の検証入口は **`npm run harness:verify` の1つだけ**とする。
以下の個別checker / npm commandはオーケストレーター内部のgate構成を説明するものであり、通常の完了判定では直接呼び分けない。

## Gate 0: Context
- `AGENTS.md`、関連する`.agents/standards/`、`.agents/profiles/`、Task Contractを確認する。
- 目的、Done条件、本番影響が不明なら実装前に整理する。
- spec駆動の機能追加では、通常のHarnessが現在作成済みの段階とレビュー順序を検査する。`sdd-analyze` では `npm run harness:verify -- --spec-complete` を使い、requirements/design/tasksの存在・レビュー済み・要求IDのtraceability・taskごとの`checks`フィールドを完全検査する。
- その上で `sdd-analyze`スキル(実体: `.agents/skills/sdd-analyze/SKILL.md`)のセマンティックな整合性チェックを行う。

## Gate 1: Static
Harness内部では次を実行する。

```bash
node .agents/scripts/harness/checks/source-layout-check.mjs
npm run format:check
npm run typecheck
npm run lint
```

`source-layout-check.mjs` はH069としてpublic functionをprivate helperより上へ配置し、トップレベルprivate helperへ日本語JSDocを付ける規約を検証する。formatterはcode styleと不要diffを機械的に収束させる。lintはcode correctnessや危険なpatternに加え、H068 `public-api-jsdoc` として公開APIのJSDoc存在を検証する。JSDoc不足やsource layout違反はHarness VerifyとCIを通過させない。

## Gate 2: Unit
```bash
npm run test
```

## Gate 3: Target Runtime
対象runtime固有テストを実行する。Cloudflareの場合は Workers Vitest integration を優先する。

## Gate 4: Data / Storage
DBやobject storageを変更した場合、migration・repository・storage integration testを実行する。

## Gate 5: Integration
HTTP等の実際の入口から代表フローを通す。

## Gate 6: Browser E2E
UI変更ではprimary flowと最低限のsmokeを実行する。

## Gate 7: Build
```bash
npm run build
npm run build-storybook
```

rootに `build-storybook` scriptが存在する場合、完全検証の `npm run harness:verify` はStorybook buildまで必ず実行する。変更種別ごとの最小チェック判断はVerification Matrixで行うが、Harness VerifyとGitHub Actionsは同じ完全ゲートを利用し、ローカルとCIでコマンド列を二重管理しない。

Browser E2Eはproduction build後に実行する。既にbuild済みのHarness/CIでは `test:e2e:run` を優先し、単独実行用 `test:e2e` に含まれる再buildを避ける。

## Gate 8: Diff
```bash
git diff --check
git status --short
```

確認項目:
- secretなし
- unrelated changeなし
- debug logなし
- skipped testなし
- migration改変なし
- exported public APIとトップレベルprivate helperのJSDocが実装と同期している
- public functionがprivate helperより上に配置されている
- spec駆動の機能追加では、`docs/specs/<feature>/`のドキュメントが実装内容と同期している

## Gate 9: Evidence
最終報告にchanged files、実行コマンド、PASS/FAIL、未検証事項を残す。

## Automatic enforcement surfaces

完全検証のsource of truthと公開入口は常にrootの `npm run harness:verify` とする。
実行タイミングだけを次のsurfaceで強制する。

- Claude Code: `.claude/settings.json` の `Stop` Hook → `npm run harness:verify -- --hook`
- Codex: `.codex/hooks.json` の `Stop` Hook → `npm run harness:verify -- --hook`
- GitHub Actions: `npm run harness:verify`

`--hook` は別の検証器ではなく、同じ `.agents/scripts/harness/harness-verify-orchestrator.sh` が失敗statusをStop Hook用のexit code 2へ変換する実行モードである。

Hookはlocalの自己修正loopを閉じるための早期強制であり、CIの代替ではない。
Codexのproject-local hookは初回またはdefinition変更時にtrustが必要なため、GitHub Actionsのgateを削除してはならない。

詳細は `.agents/harness-engineering/agent-hook-enforcement.md` を参照する。
