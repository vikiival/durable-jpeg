import { MiddlewareHandler } from 'hono'
import { isAddress } from '@polkadot/util-crypto'
import { toSS58 } from '../utils/address'
import { HonoEnv } from '../utils/constants'

export function authAddressExtractor(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const rawAddress = c.req.header('x-auth-address')

    if (!rawAddress || !isAddress(rawAddress)) {
      return c.json({ error: 'invalid auth address' }, 400)
    }

    c.set('validatedAddress', toSS58(rawAddress))
    await next()
  }
}
