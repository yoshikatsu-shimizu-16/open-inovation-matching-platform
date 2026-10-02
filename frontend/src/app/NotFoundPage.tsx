import { Link } from 'react-router'

/**
 * 未定義routeへ到達した場合のfallback page。
 * SPA内部の移動で相談開始画面へ戻る導線を提供する。
 */
export function NotFoundPage() {
  return (
    <section className="grid gap-4" aria-labelledby="not-found-title">
      <p className="m-0 text-sm font-bold tracking-[0.08em] text-muted-foreground uppercase">
        404
      </p>
      <h1
        id="not-found-title"
        className="m-0 text-4xl font-bold tracking-tight"
      >
        ページが見つかりません
      </h1>
      <p className="m-0 max-w-[60ch] leading-7 text-muted-foreground">
        指定されたページは見つかりませんでした。相談開始画面へお戻りください。
      </p>
      <Link className="w-fit font-medium underline underline-offset-4" to="/">
        相談開始画面へ戻る
      </Link>
    </section>
  )
}
