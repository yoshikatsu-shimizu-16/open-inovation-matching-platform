import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** 自由記述フォームの表示状態と操作。通信は呼び出し元へ委ねる。 */
export type ConsultationStartFormProps = {
  content: string
  submitting: boolean
  error?: string
  onContentChange: (content: string) => void
  onSubmit: () => void
}

/** 入力例、送信状態、入力を保持した再試行操作を表示する。 */
export function ConsultationStartForm({
  content,
  submitting,
  error,
  onContentChange,
  onSubmit,
}: ConsultationStartFormProps) {
  return (
    <form
      className="space-y-5"
      aria-busy={submitting}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="consultation-content">相談内容</Label>
        <Textarea
          id="consultation-content"
          className="min-h-48 resize-y"
          value={content}
          disabled={submitting}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="例：自社の技術を活用できる共同研究先を探したい。現在の課題や、相手に期待することを書いてください。"
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? 'consultation-help consultation-error' : 'consultation-help'
          }
        />
        <p id="consultation-help" className="text-sm text-muted-foreground">
          まだ整理できていなくても構いません。今の状況を、ご自身の言葉で教えてください。
        </p>
      </div>
      {error && (
        <p
          id="consultation-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting
          ? '開始しています…'
          : error && content.trim()
            ? 'もう一度試す'
            : '相談を始める'}
      </Button>
    </form>
  )
}
