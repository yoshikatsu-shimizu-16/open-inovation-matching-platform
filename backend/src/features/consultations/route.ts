import { validator } from 'hono/validator'
import type { Context } from 'hono'

import { factory } from '../../factory'
import type { AppEnv } from '../../env'
import { ApiError } from '../../shared/errors/api-error'
import { createDatabase } from '../../shared/database/db'
import { startConsultation } from './commands/start-consultation'
import { createConsultationRepository } from './repository'
import type { ConsultationRepository } from './repository'

const startConsultationValidator = validator('json', (value) => {
  const body = asObject(value)
  const content = body['content']

  if (typeof content !== 'string') {
    throw new ApiError(400, 'INVALID_REQUEST', '"content" must be a string.')
  }

  return { content }
})

/** 相談開始のHTTP境界を提供するfeature sub-appを生成する。 */
export function createConsultationRoutes(
  repository?: ConsultationRepository,
  useBindings = false,
) {
  return factory
    .createApp()
    .post('/', startConsultationValidator, async (c) => {
      const command = c.req.valid('json')
      const result = await startConsultation(
        command,
        resolveConsultationRepository(c, repository, useBindings),
      )
      return c.json(result, 201)
    })
}

/** Cloudflare bindingが有効なときだけD1経由のrepositoryへ切り替え、Node testのfallbackを維持する。 */
function resolveConsultationRepository(
  context: Context<AppEnv>,
  fallback: ConsultationRepository | undefined,
  useBindings: boolean,
): ConsultationRepository {
  if (useBindings && context.env.DB) {
    return createConsultationRepository(createDatabase(context.env.DB))
  }

  if (fallback) {
    return fallback
  }

  throw new ApiError(
    500,
    'INTERNAL_ERROR',
    'Consultation repository is not configured.',
  )
}

/** unknownなJSON入力がobjectであることを保証し、validatorから安全にfield参照できる形へ変換する。 */
function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError(400, 'INVALID_REQUEST', 'JSON body must be an object.')
  }

  return value as Record<string, unknown>
}
