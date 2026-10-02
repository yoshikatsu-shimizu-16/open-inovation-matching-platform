# F001の統合受入検証

## 判定範囲

2026-10-02にT008として相談開始画面、API、local D1、障害時の再試行、公開エラーとログの境界、preview設定の拒否条件を確認した。ローカルの主要フローは検証済みである。remote previewの実環境での受入と人間による画面確認は残る。既存の仕様レビュー証跡は変更していない。

## 要求ごとの根拠

| 要求 | 今回確認した内容 | 根拠 |
| --- | --- | --- |
| REQ-001・002 | 相談入力欄、開始操作、共同研究を例にした入力例を表示する | component test、route test、Storybookのidle状態 |
| REQ-003・004 | 画面から実APIを呼び、相談をlocal D1へ保存して、APIの最初の問いと進行状況を表示する | `frontend/e2e/consultation-start.spec.ts`の成功テスト、Workerのroute test |
| REQ-005 | 空入力・空白入力では画面からAPIを呼ばず、相談を保存しない。APIへ直接空白を送っても400で拒否する | component test、画面E2E、API E2E、Workerの件数確認 |
| REQ-006 | HTTPエラーと通信失敗の後も本文を保持する。再試行は実APIを呼び、D1へ保存する | component test、故障を注入した画面E2Eからの実API再試行 |
| REQ-007 | 正常応答に相談本文を含めない。保存失敗時も公開応答に本文・SQL・stackを出さず、本文を一般ログへ出さない | backend integration、Workerのrepository test・route test |
| REQ-008 | Workers + Assets + Hono + local D1の同一originで、開始から初期表示までを検証する | Playwright全9件とHarness |
| previewのアクセス境界 | Access未設定時はremote設定生成を拒否し、migrationとdeployに進まない。公開用の別経路を無効にし、Accessのallowlistを構成する | infrastructure全9件、Terraform構成検証とmock test |

送信中の操作抑止もcomponent testで確認した。本文はtrimして保存せず、入力どおりAPIへ渡す。空白判定だけtrim後の値を使う。

## 障害系の検証方法

ブラウザの通信失敗と500応答はPlaywrightのrouteで最初の1回だけ注入した。再試行時はrouteの介入を外し、実際のHonoとlocal D1へ到達することを確認した。このテストをD1自体の障害再現とは扱わない。

保存処理の失敗はbackendとWorkerのHTTP境界へ注入したrepositoryで確認した。内部エラーに相談本文とSQLを含めても、公開応答は固定の`500 INTERNAL_ERROR`になり、本文は一般ログへ出ない。正常保存と空白拒否は実際のWorker bindingとD1で別途確認した。

不正JSONへの対応R002〜R004はユーザーの指示で保留している。今回の受入結果に、不正JSONを400で拒否する検証は含めない。

## 実行した検証

T006・T007・T008の実装後に`npm run harness:verify`を手動実行し、それぞれ終了コード0で成功した。T008の最新実行ではfrontend unit 13件、backend unit 11件、runtime 3件、Worker 11件、backend integration 6件、infrastructure 9件、E2E 9件が成功した。形式・型・lint・アプリとStorybookのビルド・差分チェックも実行した。既存のfrontend lint警告は2件で、エラーはない。

ローカルのTerraformは1.11.0でproviderも未取得のため、`terraform validate`は終了コード1だった。要求されるTerraform 1.16.3とprovider 5.24.0での構成検証とmock test4件は、PR #22のInfrastructure Plan CIで成功した。remote-planは実行条件に該当せずスキップされたため、remote検証の成功とは扱わない。

編集時の自動Hook起動と終了時のStop Hook結果は未確認である。手動のHarness実行を根拠とする。日本語を保存したファイルにはyomiyasuのlintを個別に実行し、既存記録やコードに対する文体上の見直し候補は意味を保って確認した。

## 残る受入と再開手順

GitHubのEnvironment一覧は空で、preview用のhostname・許可する利用者・Cloudflare側の設定は未確認である。[previewアクセス制御の手順](../../exec-plans/F001-preview-access.md)に沿って前提を設定し、人間がInfrastructure Plan・Applyを確認した後、previewをデプロイする。未ログインの利用者と許可していない利用者の拒否、許可した利用者の相談開始、別URLからの迂回拒否を実環境で確認する。

今回作成したPR #22はリポジトリ内の実装と検証をレビューするためのものである。人間によるマージとremote受入の証跡が揃うまでは、F001全体を検証完了として全体要件台帳へ反映しない。後続の不足情報確認や候補評価には進まない。
