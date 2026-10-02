import { Card, CardContent } from '@/components/ui/card'
import { ConsultationStartForm } from './ConsultationStartForm'
import {
  useConsultationStart,
  type ConsultationStartState,
} from './useConsultationStart'

/** 相談入力から初期質問の表示までを同じ画面で提供する。 */
export function ConsultationStartPage() {
  const { content, state, changeContent, submit } = useConsultationStart()
  return (
    <ConsultationStartView
      content={content}
      state={state}
      onContentChange={changeContent}
      onSubmit={() => {
        void submit()
      }}
    />
  )
}

/** APIやルーティングに依存せず、相談開始の主要状態を表示する。 */
export function ConsultationStartView({
  content,
  state,
  onContentChange,
  onSubmit,
}: {
  content: string
  state: ConsultationStartState
  onContentChange: (content: string) => void
  onSubmit: () => void
}) {
  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          共創マッチングプラットフォーム
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">相談を始める</h1>
        <p className="leading-relaxed text-muted-foreground">
          課題や、実現したいことを教えてください。相談内容を起点に、共創の可能性を整理していきます。
        </p>
      </header>
      <Card>
        <CardContent>
          {state.phase === 'succeeded' ? (
            <div className="space-y-5" aria-live="polite">
              <p
                role="status"
                className="text-sm font-medium text-muted-foreground"
              >
                {state.result.progress.label}
              </p>
              <h2 className="text-xl font-semibold">最初の問い</h2>
              <p className="text-lg leading-relaxed">
                {state.result.firstQuestion.text}
              </p>
            </div>
          ) : (
            <ConsultationStartForm
              content={content}
              submitting={state.phase === 'submitting'}
              error={state.phase === 'failed' ? state.message : undefined}
              onContentChange={onContentChange}
              onSubmit={onSubmit}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
