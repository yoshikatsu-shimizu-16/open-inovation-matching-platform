import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConsultationStartView } from './ConsultationStartPage'

const meta = {
  title: '相談/相談開始',
  component: ConsultationStartView,
  args: {
    content: '',
    state: { phase: 'idle' },
    onContentChange: () => {},
    onSubmit: () => {},
  },
} satisfies Meta<typeof ConsultationStartView>
export default meta
type Story = StoryObj<typeof meta>
export const Idle: Story = {}
export const Submitting: Story = {
  args: { content: '共同研究先を探したい', state: { phase: 'submitting' } },
}
export const Failed: Story = {
  args: {
    content: '共同研究先を探したい',
    state: {
      phase: 'failed',
      message:
        '相談を開始できませんでした。入力内容は残っています。もう一度お試しください。',
    },
  },
}
export const Succeeded: Story = {
  args: {
    state: {
      phase: 'succeeded',
      result: {
        consultation: {
          id: 'example',
          status: 'collecting_information',
          createdAt: '2026-10-02T00:00:00Z',
        },
        firstQuestion: {
          id: 'consultation-goal',
          text: 'この相談を通じて、どのような状態を実現したいですか？',
        },
        progress: {
          phase: 'information-collection',
          label: '相談内容の確認を開始しました',
        },
      },
    },
  },
}
