import type { RouteObject } from 'react-router'
import { ConsultationStartPage } from '@/features/consultation-start/ConsultationStartPage'
import { App } from './App'
import { NotFoundPage } from './NotFoundPage'

export const appRoutes = [
  {
    element: <App />,
    children: [
      {
        index: true,
        element: <ConsultationStartPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
] satisfies RouteObject[]
