import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { appRoutes } from './routes'

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  })

  render(<RouterProvider router={router} />)
}

describe('app router', () => {
  it('renders the consultation-start route', () => {
    renderRoute('/')

    expect(
      screen.getByRole('heading', { name: '相談を始める' }),
    ).toBeInTheDocument()
  })

  it('renders the not-found route for unknown paths', () => {
    renderRoute('/does-not-exist')

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to starter' }),
    ).toHaveAttribute('href', '/')
  })
})
