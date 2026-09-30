# F001 実装進捗

## 2026-09-27

- `sdd-analyze`: PASS。`npm run harness:verify -- --spec-complete` は終了コード 0。REQ-001〜008 の設計対応、設計要素と T001〜T008 の対応、constitution・用語・verification matrix との整合を確認した。
- T001: 完了。PR #16 でレビュー・マージ済み（merge commit `ef6e2f8`）。Drizzle ORM 0.45.3、D1 binding からの共通 DB factory、`consultations` の Drizzle schema を追加した。
- T001 の検証範囲: schema の列名と INSERT のパラメータを unit test で確認した。runtime、integration、E2E は既存の回帰テストを実行した。`consultations` テーブルへの実際の書き込みは、T002 の migration と T003 の repository 実装後に検証する。
- T002: 完了。PR #17 でレビュー・マージ済み（merge commit `c03853c`）。`0002_create_consultations.sql` を追加し、空のローカル D1 へ `0001` → `0002` の順で適用できることを確認した。Worker runtime テストで5列の名前・型・NOT NULL・主キー、および Drizzle 経由の INSERT / 読み戻しを確認した。
- T002 検証: 空のローカル D1 migration、backend typecheck、lint、unit、runtime、Worker、integration、build、format check と `npm run harness:verify` は PASS。最終 Harness は終了コード 0、E2E は2件成功。lint に既存 frontend の警告が2件あるが、エラーはない。
- 質問で確認した TypeScript / Drizzle の型記法と、`.toSQL()` unit test と Worker D1 test の違いを `docs/knowledge/typescript-drizzle-d1-return-type.md` に保存した。

## 2026-09-30

- T003: 実装済み、PRレビュー待ち。`features/consultations/domain/consultation.ts` に空白のみの本文を拒否する `Consultation.create` を、`repository.ts` に Drizzle 経由で保存する `createConsultationRepository` を追加した。共通 DB の型として `shared/database/db.ts` に `Database` を公開した。
- 判断: 相談本文は REQ-003 の「入力された相談内容を起点とする」に合わせ、trim せず入力どおり保存する。空白判定だけ `trim()` 後に行う。
- T003 検証: domain unit test（受理・本文保持・空白拒否）、feature 配下で D1 の `prepare()` / `bind()` / `run()` を使わないことの unit test、Worker + local D1 で保存・ログ非出力・同一 id 重複時のエラーを確認した。`npm run harness:verify` は終了コード 0。lint の警告は既存 frontend の2件のみ。
