# F001のpreviewアクセス制御

## 実装と公開の境界

T007はCloudflare Accessで専用hostname全体を保護する。Reactの画面、静的ファイル、HonoのAPIを同じアクセス境界の内側に置く。Terraformで明示したメールアドレスだけを許可する。正式なアプリ内認証は後続機能で扱う。

前提が未設定の間は公開しない。TerraformはAccess applicationを作らず、previewのhostnameとapplication IDを空文字で返す。デプロイworkflowはその状態でWrangler設定の生成を拒否し、D1のremote migrationとWorkerのdeployを開始しない。ローカル設定でも`workers_dev: false`、`preview_urls: false`、`routes: []`を指定する。

公開する場合もworkers.devとversion URLを無効にし、Accessで保護した専用custom domainだけを設定する。[CloudflareのWrangler設定](https://developers.cloudflare.com/workers/wrangler/configuration/)と[利用中のTerraform provider 5.24.0のAccess schema](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.24.0/docs/resources/zero_trust_access_application.md)に従う。

Accessを削除すると、稼働中のWorkerがアクセス制御を失う。そのためAccessには`prevent_destroy`を設定し、hostnameも稼働後の変更を拒否する。出力するhostnameは希望値ではなく、Access applicationの実際のdomainから取得する。公開後のhostname変更やgateの撤去は、既存Workerの経路を先に閉じる別作業として扱う。

## 運営者が用意する前提

Cloudflare管理下のpreview専用hostname、利用を許可するメールアドレス、Zero Trustのログイン方法を決める。既存のD1・R2・Terraform state用の設定に加え、GitHubのpreview Environmentへ次を設定する。

| 変数 | 内容 |
| --- | --- |
| `PREVIEW_HOSTNAME` | パスやwildcardを含まない専用hostname |
| `PREVIEW_ALLOWED_EMAILS` | 許可するメールアドレスのJSON配列 |

credentials、実際のresource ID、許可する利用者の個人情報は、この文書やコードへ保存しない。

人間がInfrastructure Planのpreviewを確認し、Infrastructure ApplyでAccessを適用する。その後、Cloudflare Application Deployでpreviewを選ぶ。workflowは適用済みTerraform stateからhostnameとapplication IDを読み取る。前提の設定やCloudflareへの適用は今回実行していない。

## 受入条件と依存関係

T007はT005に依存する。設定生成テストでAccess未設定時の拒否、公開用URLの無効化、専用domainの指定を確認する。Terraformのmock testでAccessのhostname、allowlist、preflightの保護、前提未設定時のresource非作成を確認する。T008でローカルの相談フローと公開前の確認事項をまとめる。

remote previewの受入は公開後に行う。未ログインのブラウザではトップ画面と`/api/health`に到達できないことを確認する。許可した利用者はログイン後に相談を作成でき、許可していない利用者は利用できないことを確認する。workers.devとversion URLからもアクセス境界を迂回できないことを確かめる。

## 今回の状態

2026-10-02にGitHubのEnvironment一覧を取得し、previewを含むEnvironmentが未作成であることを確認した。そのため、remoteへの適用・公開・受入確認は未実施とする。リポジトリ内の実装とCI検証を進め、remote検証が残ることを明記して引き渡す。productionへの適用やデプロイは今回の対象にしない。
