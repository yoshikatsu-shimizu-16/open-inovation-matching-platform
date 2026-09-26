---
name: sdd-project-requirements
description: プロジェクト開始時や全体の目的・範囲を改訂する時に、機能別SPECより先に全体要件とFR/NFR台帳を作成・更新する。
---

# Project requirements

## Output

`docs/project-requirements.md`（`.agents/sdd/templates/project-requirements.template.md`を使用）。

## Steps

1. ユーザーの意図、既存の業務資料、`ARCHITECTURE.md`、既存の要求台帳を確認する。欠けた事業判断は質問し、推測で確定しない。
2. サービス目的、利用者、全体フロー、初期段階と後続段階、対象外を定める。機能別設計やタスクへ分解しない。
3. 機能要求を `FR-001`、非機能要求を `NFR-001` から別系列で採番し、受入条件、状態、対象段階、対応SPEC、完了日、検証根拠を台帳に置く。発行済みIDは再利用せず、削除時は「取り下げ」として履歴を残す。
4. 変更時は影響するIDと機能別SPECを列挙し、変更履歴を更新する。検証済みから要求を変えた場合は状態とレビューを再評価する。
5. `## Review` を `Status: pending` のまま人間レビュー用PRへ出す。Agent自身の判断で `reviewed` にしない。
6. 人間がPRをMergeすると `.github/workflows/sdd-review-evidence.yml` がMerge証跡をReview metadataへ同期する。

## Stop condition

`## Review` の `Status: reviewed` とPR証跡が記録されるまで `sdd-constitution` に進まない。正式な承認操作は人間によるレビュー用PRのMergeであり、Agentがmetadataを直接承認状態へ変更してはならない。

このスキルは全体要件だけを作成・改訂する。
