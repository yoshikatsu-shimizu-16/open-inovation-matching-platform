import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConsultationStartPage } from './ConsultationStartPage'

const result = {
  consultation: {
    id: 'consultation-1',
    status: 'collecting_information',
    createdAt: '2026-10-02T00:00:00Z',
  },
  firstQuestion: {
    id: 'consultation-goal',
    text: 'どのような状態を実現したいですか？',
  },
  progress: {
    phase: 'information-collection',
    label: '相談内容の確認を開始しました',
  },
}

afterEach(() => vi.restoreAllMocks())

describe('相談開始', () => {
  it('入力例を表示し、空白だけなら送信しない', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    render(<ConsultationStartPage />)
    const input = screen.getByRole('textbox', { name: '相談内容' })
    expect(input).toHaveAttribute(
      'placeholder',
      expect.stringContaining('共同研究'),
    )
    fireEvent.change(input, { target: { value: ' \n　' } })
    fireEvent.click(screen.getByRole('button', { name: '相談を始める' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      '相談内容を入力してください',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('送信中は多重操作を防ぎ、APIの問いと進行状況を表示する', async () => {
    let resolve!: (response: Response) => void
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    render(<ConsultationStartPage />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  共同研究先を探したい  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: '相談を始める' }))
    expect(
      screen.getByRole('button', { name: '開始しています…' }),
    ).toBeDisabled()
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolve(new Response(JSON.stringify(result), { status: 201 }))
    expect(
      await screen.findByText(result.firstQuestion.text),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(result.progress.label)
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ content: '  共同研究先を探したい  ' }),
    )
  })

  it.each(['http', 'network'])(
    '%sの失敗後も本文を保持して再試行する',
    async (failure) => {
      const fetchMock = vi.spyOn(globalThis, 'fetch')
      if (failure === 'http')
        fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
      else fetchMock.mockRejectedValueOnce(new TypeError('network'))
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(result), { status: 201 }),
      )
      render(<ConsultationStartPage />)
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: '共同研究先を探したい' },
      })
      fireEvent.click(screen.getByRole('button', { name: '相談を始める' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('もう一度')
      expect(screen.getByRole('textbox')).toHaveValue('共同研究先を探したい')
      fireEvent.click(screen.getByRole('button', { name: 'もう一度試す' }))
      await waitFor(() =>
        expect(screen.getByText(result.firstQuestion.text)).toBeInTheDocument(),
      )
      expect(fetchMock).toHaveBeenCalledTimes(2)
    },
  )
})
