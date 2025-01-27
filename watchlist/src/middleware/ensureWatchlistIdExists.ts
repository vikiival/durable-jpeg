import { MiddlewareHandler } from 'hono'
import { HonoEnv } from '../utils/constants'
import { createWatchlist, getWatchlistByPublicId } from '../utils/db'

export function ensureWatchlistPublicIdExists(): MiddlewareHandler<HonoEnv, '/:watchlistPublicId'> {
  return async (c, next) => {
    const { watchlistPublicId } = c.req.param()

    if (watchlistPublicId === 'default' && Number.isNaN(Number(watchlistPublicId))) {
      return next()
    }

    const validatedAddress = c.get('validatedAddress')

    let watchlist

    try {
      watchlist = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)
    } catch (error) {
      console.error(error)
    }

    if (!watchlist && watchlistPublicId === validatedAddress) {
      // ensure default watchlist exists
      await createWatchlist({ publicId: watchlistPublicId, address: validatedAddress, name: 'Default' }, c.env.DB)
      return next()
    }

    if (!watchlist || watchlist.address !== validatedAddress) {
      return c.json({ error: 'watchlist not found' }, 404)
    }

    return next()
  }
}
