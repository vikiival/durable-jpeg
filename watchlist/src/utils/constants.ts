import { Env } from 'hono/types'

interface CloudflareEnv extends Record<string, any> {
  DB: D1Database
}

interface HonoVariables extends Record<string, any> {
  // added in authAddressExtractor.ts
  validatedAddress: string
}

export interface HonoEnv extends Env {
  Bindings: CloudflareEnv
  Variables: HonoVariables
}
