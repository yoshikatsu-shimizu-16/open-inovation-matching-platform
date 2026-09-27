-- F001の相談開始状態を保存する最小スキーマ。
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY NOT NULL,
  initial_content TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
