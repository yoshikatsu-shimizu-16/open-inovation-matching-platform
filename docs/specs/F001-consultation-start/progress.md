# F001 実装進捗

## 2026-09-27

- `sdd-analyze`: PASS。`npm run harness:verify -- --spec-complete` は終了コード 0。REQ-001〜008 の設計対応、設計要素と T001〜T008 の対応、constitution・用語・verification matrix との整合を確認した。
- T001: 完了。PR #16 でレビュー・マージ済み（merge commit `ef6e2f8`）。Drizzle ORM 0.45.3、D1 binding からの共通 DB factory、`consultations` の Drizzle schema を追加した。
- T001 の検証範囲: schema の列名と INSERT のパラメータを unit test で確認した。runtime、integration、E2E は既存の回帰テストを実行した。`consultations` テーブルへの実際の書き込みは、T002 の migration と T003 の repository 実装後に検証する。
- T002: 完了。PR #17 でレビュー・マージ済み（merge commit `c03853c`）。`0002_create_consultations.sql` を追加し、空のローカル D1 へ `0001` → `0002` の順で適用できることを確認した。Worker runtime テストで5列の名前・型・NOT NULL・主キー、および Drizzle 経由の INSERT / 読み戻しを確認した。
- T002 検証: 空のローカル D1 migration、backend typecheck、lint、unit、runtime、Worker、integration、build、format check と `npm run harness:verify` は PASS。最終 Harness は終了コード 0、E2E は2件成功。lint に既存 frontend の警告が2件あるが、エラーはない。
- 質問で確認した TypeScript / Drizzle の型記法と、`.toSQL()` unit test と Worker D1 test の違いを `docs/knowledge/typescript-drizzle-d1-return-type.md` に保存した。

## 2026-09-30

- T003: 完了。PR #18 でレビュー・マージ済み（merge commit `5b0504b`）。`features/consultations/domain/consultation.ts` に空白のみの本文を拒否する `Consultation.create` を、`repository.ts` に Drizzle 経由で保存する `createConsultationRepository` を追加した。共通 DB の型として `shared/database/db.ts` に `Database` を公開した。
- 判断: 相談本文は REQ-003 の「入力された相談内容を起点とする」に合わせ、trim せず入力どおり保存する。空白判定だけ `trim()` 後に行う。
- T003 検証: domain unit test（受理・本文保持・空白拒否）、feature 配下で D1 の `prepare()` / `bind()` / `run()` を使わないことの unit test、Worker + local D1 で保存・ログ非出力・同一 id 重複時のエラーを確認した。`npm run harness:verify` は終了コード 0。lint の警告は既存 frontend の2件のみ。
- T004: 実装済み、PRレビュー待ち。Playwright の webServer を `vite preview` から `backend/` の `wrangler dev`（Workers + Assets）に替え、SPA と `/api/*` を同一 origin で起動する。起動前に E2E 専用の local D1（`backend/.wrangler/e2e-state`）へ `0001` → `0002` の migration を適用する。起動設定と D1 照会は `frontend/e2e/support/local-runtime.ts` にまとめた。
- T004 検証: `consultations` テーブルが E2E 用 local D1 に適用済みであることの E2E を追加した。browser から `/api/*` を通って D1 に保存されることは、F001 の要件外であるテンプレートの tasks に依存させないため T004 では確認せず、T005 の `POST /api/consultations` の E2E で確認する。既存の smoke 2件も新しい起動経路で PASS。E2E 用 D1 を消した空の状態からも PASS を確認した。
- T004 付随修正: `wrangler dev` が `backend/.wrangler/tmp` に一時ファイルを作り、E2E 実行後の Harness で backend の Prettier が失敗したため、backend の `.prettierignore` と ESLint の ignores に `.wrangler` を追加した。`npm run harness:verify` は終了コード 0（E2E 4件 PASS、lint の警告は既存 frontend の2件のみ）。
- T004 レビュー対応（PR #19）: 開発用 backend（`backend/src/dev.ts`）と `wrangler dev` の既定ポート 8787 と重なり、Playwright が起動済みの別サーバーを使い回すおそれがあった。E2E 専用ポートを 8797 にし、`reuseExistingServer` を `false` にした。

## 2026-09-30 (T005)

- T005: 実装済み、PRレビュー待ち。`features/consultations/commands/start-consultation.ts` で相談生成・保存後に `firstQuestion`（`consultation-goal`）と `progress`（`information-collection`）を組み立て、`features/consultations/route.ts` の `POST /` で JSON の `content` 検証と `201` 応答を実装した。`app.ts` は `createApp(taskRepository?, consultationRepository?)` の第2引数で consultation repository を注入可能にし、未指定時は `c.env.DB` から Drizzle 経由の repository を解決する。
- T005 検証: backend integration test（正常系 `201` とレスポンス形状、空白入力の `400` + repository 不呼び出し、`content` が string でない request の `400`）、Worker + local D1 integration test（binding 経由で保存されること、応答に相談本文を含まないこと、空白入力で D1 の行数が増えないこと）、Playwright API contract E2E（`POST /api/consultations` を実際に Hono + local D1 まで通し、成功時の保存内容と失敗時の非永続化を確認）を追加した。`npm run harness:verify` は終了コード 0（backend unit/runtime/integration/worker、frontend unit、E2E 5件 PASS、lint の警告は既存 frontend の2件のみ）。
- 判断: `firstQuestion` / `progress` は F001 の決定的な初期値として `commands/start-consultation.ts` に定数で持たせ、`handoff` / `nextFeature` など内部 feature 構成は応答へ露出させない（design.md のリスク欄と一致）。
- 未検証事項: T006 で frontend から実際に呼び出す利用者フロー（成功時の表示、失敗時の入力保持・再試行）は本タスクの対象外。

## 2026-10-01 (PR #20 レビュー対応・R001)

- R001: [仕様改訂案](../../drafts/pr20-review-response.md)を作成し、人間レビュー待ち。不正JSONを全API共通で`400 INVALID_REQUEST`へ変換する要求案と、共有local D1を使うE2Eの直列実行方針、受入条件、後続タスクの状態・依存関係・停止点を記録した。今回は文書のみで、T005のAPI修正・E2E設定修正・T006以降には進まない。
- 調査根拠: 不正JSON、途中切れ、空本文で現行APIの500を再現した。Stop HookのHarnessは5 workerのE2EでD1ロックにより失敗した。変更前の`CI=true npm run harness:verify`は終了コード0、1 workerでE2E 5件成功。反復検証は未実施。
- レビュー境界: requirementsをpendingへ戻すと、既存design/tasksの存在により現行Harnessが工程順序違反と判定する。正本とそのレビュー証跡を維持し、draftに改訂案を置いた。正本への反映と再レビューの手順は人間と確定してから着手する。draftの作成は仕様承認やコード修正の完了を意味しない。

## 2026-10-01（R005 E2E設定修正）

ユーザーの承認を受け、R005だけを実施した。`frontend/playwright.config.ts`を`workers: 1`、`fullyParallel: false`に変更し、ローカルとCIの両方でテストを順番に実行する。同じローカルD1を共有する構成と、保存件数を比較するテストは維持した。

変更前のStop Hookでは、D1への問い合わせが`SQLITE_BUSY`で繰り返し失敗していた。変更後は`npm run test:e2e:run --workspace @dev-standard/frontend -- --retries=0`を3回連続で実行し、毎回5件が成功した。各回の終了コードは0で、D1ロックは発生しなかった。

通常条件の`npm run harness:verify`はPASS、終了コード0。形式チェック、型チェック、lint、unit、runtime、Worker、integration、ビルド、Storybookビルド、E2E、差分チェックを通過した。Harness内のE2Eも5件成功した。lintには既存のfrontend警告が2件ある。ファイル編集時のHook起動は確認していないため、検証を手動で実行する。終了時のStop Hookの結果は、実際の起動後に確認する。

今回の結果は既存E2Eの検証であり、R004で予定する不正JSONのケースは含まない。R002〜R004、T006以降、追加のコミット・Push・マージには進まない。
