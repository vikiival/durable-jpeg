import { validator } from 'hono/validator'
import { z } from 'zod'

export function watchlistCreateParamsValidator() {
  return validator('json', (value, c) => {
    const parsed = z.object({ name: z.string() }).safeParse(value)

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400)
    }

    return parsed.data
  })
}

export function watchlistItemCreateParamsValidator() {
  return validator('json', (value, c) => {
    const parsed = z
      .object({
        type: z.literal('nft').or(z.literal('collection')),
        itemId: z.string(),
      })
      .safeParse(value)

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400)
    }

    return parsed.data
  })
}
