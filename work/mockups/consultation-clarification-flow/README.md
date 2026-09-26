# 相談・課題明確化フロー モックアップ

段階1「相談と課題の明確化」の画面と操作フローを確認するための一時モック。

## 確認方法

リポジトリのルートから次を実行する。

```bash
cd work/mockups/consultation-clarification-flow
python3 -m http.server 4173
```

ブラウザで `http://localhost:4173/` を開く。

ビルドや外部サービス接続は不要。HTML / CSS / JavaScript だけで動作する。

## ファイル

- `index.html`: 画面構造
- `consultation-clarification-mockup.css`: レビュー用スタイル
- `consultation-clarification-mockup.js`: 画面遷移とサンプル操作
- `consultation-clarification-mockup-review.md`: 確認したい問い、仮説、未決事項、次工程の機能分割たたき台

## 対象範囲

- 相談開始
- 5カテゴリ・13項目の聞き取り
- 未確認状態
- 共創仮説の確認・修正
- 課題プロフィールの確認・修正
- 課題プロフィールの明示的な確定

候補評価、認証、永続化、実AI/API接続は今回の対象外。
