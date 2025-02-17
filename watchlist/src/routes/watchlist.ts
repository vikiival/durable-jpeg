import { Hono } from 'hono'
import { ensureWatchlistPublicIdExists } from '../middleware/ensureWatchlistIdExists'
import { watchlistCreateParamsValidator } from '../middleware/validator'
import { HonoEnv } from '../utils/constants'
import { createWatchlist, deleteWatchlistById, getWatchlistByPublicId, searchWatchlist, updateWatchlist } from '../utils/db'

const app = new Hono<HonoEnv>()

app.get('/', async (c) => {
  const address = c.get('validatedAddress')
  const result = await searchWatchlist({ address }, c.env.DB)
  return c.json(result)
})

app.post('/', watchlistCreateParamsValidator(), async (c) => {
  const address = c.get('validatedAddress')
  const { name } = c.req.valid('json')

  const createParams = { address, name }
  const result = await createWatchlist(createParams, c.env.DB)

  return c.json(result)
})

app.get('/:watchlistPublicId', async (c) => {
  const { watchlistPublicId } = c.req.param()
  const result = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)
  return c.json(result)
})

app.put('/:watchlistPublicId', ensureWatchlistPublicIdExists(), watchlistCreateParamsValidator(), async (c) => {
  const { watchlistPublicId } = c.req.param()
  const { name } = c.req.valid('json')

  const body = {
    name,
    publicId: watchlistPublicId,
  }

  const result = await updateWatchlist(body, c.env.DB)

  return c.json(result)
})

app.delete('/:watchlistPublicId', ensureWatchlistPublicIdExists(), async (c) => {
  const { watchlistPublicId } = c.req.param()
  const address = c.get('validatedAddress')

  if (watchlistPublicId === address) {
    return c.json({ error: 'cannot delete default watchlist' }, 400)
  }

  const watchlist = await getWatchlistByPublicId(watchlistPublicId, c.env.DB)
  await deleteWatchlistById(watchlist.id, c.env.DB)

  return c.json({ ok: true })
})

export { app as watchlist }
