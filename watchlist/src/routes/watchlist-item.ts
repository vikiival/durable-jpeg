import { Hono } from 'hono'
import { watchlistItemCreateParamsValidator } from '../middleware/validator'
import { HonoEnv } from '../utils/constants'
import { countWatchlistItems, createWatchlistItem, deleteWatchlistItem, getWatchlistByPublicId, searchWatchlistItems } from '../utils/db'

const app = new Hono<HonoEnv, {}, '/watchlists/:watchlistPublicId/chains/:chain/items'>()

app.get('/', async (c) => {
  const { watchlistPublicId, chain } = c.req.param()
  const { type, limit, offset, sort = 'createdAt_DESC' } = c.req.query()

  const watchlist = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)
  const searchQuery = { chain, type, watchlistId: watchlist.id }

  const [watchlistItems, total] = await Promise.all([
    searchWatchlistItems({ ...searchQuery, limit, offset, sort }, c.env.DB),
    countWatchlistItems({ ...searchQuery }, c.env.DB),
  ])
  return c.json({ data: watchlistItems, total })
})

app.post('/', watchlistItemCreateParamsValidator(), async (c) => {
  const { watchlistPublicId, chain } = c.req.param()
  const { type, itemId } = c.req.valid('json')

  const watchlist = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)

  const createParams = {
    watchlistId: watchlist.id,
    itemId,
    chain,
    type,
  }

  const existedResult = await searchWatchlistItems({ ...createParams, limit: 1 }, c.env.DB)

  if (existedResult.length) {
    return c.json({ error: 'item already exists' }, 409)
  }

  const result = await createWatchlistItem(createParams, c.env.DB)

  return c.json(result)
})

app.get('/:itemId/exists', async (c) => {
  const { chain, watchlistPublicId, itemId } = c.req.param()
  const { type } = c.req.query()

  const watchlist = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)

  const searchQuery = {
    chain,
    type,
    watchlistId: watchlist.id,
    itemId,
    limit: 1,
  }

  const result = await searchWatchlistItems(searchQuery, c.env.DB)

  return c.json({ exists: result.length > 0 })
})

app.delete('/:itemId', async (c) => {
  const { chain, watchlistPublicId, itemId } = c.req.param()

  const watchlist = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)

  const params = {
    watchlistId: watchlist.id,
    chain,
    itemId,
  }

  await deleteWatchlistItem(params, c.env.DB)
  return c.json({ ok: true })
})

export { app as watchlistItem }
