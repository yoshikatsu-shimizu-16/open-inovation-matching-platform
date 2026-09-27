# TypeScript と Drizzle の D1 戻り値型

`createDatabase` の戻り値は、Drizzle が返す型をそのまま明示している。

```ts
export function createDatabase(
  binding: D1Database,
): DrizzleD1Database<typeof schema> & { $client: D1Database } {
  return drizzle(binding, { schema });
}
```

## 型注釈を普通の言葉にすると

この関数は「`schema` のテーブル情報を使って操作できる Drizzle の D1 DB オブジェクト」を返す。さらに、返される値には `$client` というプロパティがあり、その値は元の `D1Database` である。

Drizzle 0.45.3 の宣言では `drizzle()` の戻り値が `DrizzleD1Database<TSchema> & { $client: TClient }` と定義されている。`createDatabase` の型注釈は、その宣言に `typeof schema` と `D1Database` を当てはめたもの。実装本体でも `db.$client = client` と代入してから `db` を返している。

## 記号を一つずつ読む

### `<...>`: 型引数

```ts
DrizzleD1Database<typeof schema>;
```

`DrizzleD1Database` は、テーブル定義の情報を型引数として受け取る型。ここでの `typeof schema` は値を調べる JavaScript の `typeof` ではなく、TypeScript の型位置にある `typeof` で、「変数 `schema` が持つ構造の型」を取り出す。

これにより Drizzle は `db.insert(consultations)` などで、`consultations` の列名や値の型をチェックできる。

### `&`: 両方の型の条件を満たす

```ts
SomeDatabaseType & { $client: D1Database };
```

`&` は TypeScript の交差型。返る値を「左側の Drizzle DB としても使え、右側に書いた `$client` プロパティも持つ値」として扱う。実行時にオブジェクトを合成したり、別のフィールドを自動追加したりする演算子ではない。これは型検査のための記述。

この例の `{ $client: D1Database }` は、オブジェクトの形を表す型である。`$` は特別な演算子ではなく、プロパティ名 `$client` の一部。

### `{ schema }`: オブジェクトの省略記法

```ts
{
  schema;
}
```

これは `{ schema: schema }` と同じ JavaScript のオブジェクトリテラル。変数名とプロパティ名が同じときに短く書ける。Drizzle の第2引数 `config` 自体は省略可能だが、この呼び出しでは schema を渡すため、引数を省略していない。

## Java と比べると

Java にそのまま対応する交差型構文はないが、読み方は「返り値が Drizzle DB の契約を満たし、かつ `$client` を持つ契約も満たす」と考えるとよい。型引数 `<...>` は、Java のジェネリック型へ具体的な型情報を渡すイメージに近い。

## テストとの区別

`backend/tests/unit/database-schema.test.ts` は `.toSQL()` を呼び、生成される INSERT の列名とパラメータを確認する。これは DB に接続して行を保存するテストではない。

Worker runtime テストはテスト専用 D1 に migration を適用し、Drizzle で行を書いて読み返す。これは migration 後のテーブルと DB 書き込みの互換性を確認するためのテストで、本番 D1 は使わない。
