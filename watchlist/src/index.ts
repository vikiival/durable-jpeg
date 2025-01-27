import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { allowedOrigin } from './utils/cors'
import { HonoEnv } from './utils/constants'
import { watchlist } from './routes/watchlist'
import { watchlistItem } from './routes/watchlist-item'
import { ensureWatchlistPublicIdExists } from './middleware/ensureWatchlistIdExists'
import { authAddressExtractor } from './middleware/authAddressExtractor'
import { omitIdInResponse } from './middleware/omitId'

const app = new Hono<HonoEnv>()

app.use('*', cors({ origin: allowedOrigin }), omitIdInResponse)
app.use('/watchlists/*', authAddressExtractor())
app.use('/watchlists/:watchlistPublicId/*', authAddressExtractor(), ensureWatchlistPublicIdExists())

app.get('/', async (ctx) => {
  return ctx.text('KODADOT WATCHLIST SERVICE - https://kodadot.xyz')
})

app.route('/watchlists', watchlist)
app.route('/watchlists/:watchlistPublicId/chains/:chain/items', watchlistItem)

app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: err.message, path: c.req.url }, 400)
})

export default app
