import { useRef, useState } from 'react'
import {
  startConsultation,
  type StartConsultationResponse,
} from '@/api/consultations'

/** 相談開始の送信状態。成功時の表示情報はAPI契約をそのまま使う。 */
export type ConsultationStartState =
  | { phase: 'idle' | 'submitting' }
  | { phase: 'failed'; message: string }
  | { phase: 'succeeded'; result: StartConsultationResponse }

/** 本文を保持しながら入力検証、送信、多重操作の抑止、再試行を管理する。 */
export function useConsultationStart() {
  const [content, setContent] = useState('')
  const [state, setState] = useState<ConsultationStartState>({ phase: 'idle' })
  const inFlight = useRef(false)

  async function submit() {
    if (inFlight.current || state.phase === 'succeeded') return
    if (!content.trim()) {
      setState({ phase: 'failed', message: '相談内容を入力してください。' })
      return
    }
    inFlight.current = true
    setState({ phase: 'submitting' })
    try {
      const result = await startConsultation({ content })
      setState({ phase: 'succeeded', result })
    } catch {
      setState({
        phase: 'failed',
        message:
          '相談を開始できませんでした。入力内容は残っています。もう一度お試しください。',
      })
    } finally {
      inFlight.current = false
    }
  }

  function changeContent(value: string) {
    setContent(value)
    if (state.phase === 'failed') setState({ phase: 'idle' })
  }

  return { content, state, changeContent, submit }
}
