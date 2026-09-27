# F001 実装進捗

## 2026-09-27

- `sdd-analyze`: PASS。`npm run harness:verify -- --spec-complete` は終了コード 0。REQ-001〜008 の設計対応、設計要素と T001〜T008 の対応、constitution・用語・verification matrix との整合を確認した。
- T001: 完了。PR #16 でレビュー・マージ済み（merge commit `ef6e2f8`）。Drizzle ORM 0.45.3、D1 binding からの共通 DB factory、`consultations` の Drizzle schema を追加した。
- T001 の検証範囲: schema の列名と INSERT のパラメータを unit test で確認した。runtime、integration、E2E は既存の回帰テストを実行した。`consultations` テーブルへの実際の書き込みは、T002 の migration と T003 の repository 実装後に検証する。
- T002: 実装済み、PRレビュー待ち。`0002_create_consultations.sql` を追加し、空のローカル D1 へ `0001` → `0002` の順で適用できることを確認した。Worker runtime テストで5列の名前・型・NOT NULL・主キー、および Drizzle 経由の INSERT / 読み戻しを確認した。
- T002 検証: backend typecheck、lint、unit、runtime、Worker、integration、build と format check は PASS。必須 `npm run harness:verify` は E2E 2件が FAIL。Playwright の port `4173` に既存 nginx が応答しており、starter画面ではなく nginx 初期画面を取得した。今回の変更対象外であることを確認し、frontend は変更していない。
- 質問で確認した TypeScript / Drizzle の型記法と、`.toSQL()` unit test と Worker D1 test の違いを `docs/knowledge/typescript-drizzle-d1-return-type.md` に保存した。
