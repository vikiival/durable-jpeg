import { CamelCasePlugin, Kysely, sql } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import { nanoid } from 'nanoid'
import { DB } from './types'

interface WatchlistSearchParams {
  address: string
}

interface WatchlistCreateParams {
  publicId?: string
  address: string
  name: string
}

interface WatchlistItemCreateParams {
  chain: string
  type: string
  watchlistId: number
  itemId: string
}

export interface WatchlistItemsSearchQuery {
  chain: string
  type?: string
  watchlistId: number
  itemId?: string
  limit?: number | string
  offset?: number | string
  sort?: string
}

function createDB(database: D1Database) {
  return new Kysely<DB>({ dialect: new D1Dialect({ database }), plugins: [new CamelCasePlugin()] })
}

export async function searchWatchlist(params: WatchlistSearchParams, database: D1Database) {
  const db = createDB(database)

  const query = db.selectFrom('watchlist').selectAll().where('address', '=', params.address)
  const result = await query.execute()

  return result
}

export async function getWatchlistByPublicId(publicId: string, database: D1Database) {
  const db = createDB(database)
  return db.selectFrom('watchlist').selectAll().where('publicId', '=', publicId).executeTakeFirstOrThrow()
}

export async function deleteWatchlistById(id: number, database: D1Database) {
  const db = createDB(database)
  await db.deleteFrom('watchlistItem').where('watchlistId', '=', id).execute()
  await db.deleteFrom('watchlist').where('id', '=', id).execute()
}

export async function createWatchlist(params: WatchlistCreateParams, database: D1Database) {
  const db = createDB(database)

  return db
    .insertInto('watchlist')
    .values({
      publicId: params.publicId || nanoid(),
      address: params.address,
      name: params.name,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateWatchlist(params: Pick<WatchlistCreateParams, 'name'> & { publicId: string }, database: D1Database) {
  const db = createDB(database)

  const updatedWatchlist = await db
    .updateTable('watchlist')
    .set({ name: params.name, updatedAt: sql`datetime('now')` })
    .where('publicId', '=', params.publicId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return updatedWatchlist
}

export async function searchWatchlistItems(searchQuery: WatchlistItemsSearchQuery, database: D1Database) {
  const db = createDB(database)

  let query = db
    .selectFrom('watchlistItem')
    .selectAll()
    .where('watchlistId', '=', searchQuery.watchlistId)
    .where('chain', '=', searchQuery.chain)

  if (searchQuery.type) {
    query = query.where('type', '=', searchQuery.type)
  }

  if (searchQuery.itemId) {
    query = query.where('itemId', '=', searchQuery.itemId)
  }

  if (searchQuery.sort === 'createdAt_ASC') {
    query = query.orderBy('createdAt', 'asc')
  }
  if (searchQuery.sort === 'createdAt_DESC') {
    query = query.orderBy('createdAt', 'desc')
  }

  if (searchQuery.limit) {
    query = query.limit(Math.min(Number(searchQuery.limit), 25))
  }

  if (searchQuery.offset) {
    query = query.offset(Math.max(Number(searchQuery.offset), 0))
  }

  try {
    return query.execute()
  } catch (error) {
    console.error(error)
    return []
  }
}
export async function countWatchlistItems(searchQuery: Omit<WatchlistItemsSearchQuery, 'limit' | 'offset'>, database: D1Database) {
  const db = createDB(database)

  let query = db
    .selectFrom('watchlistItem')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('watchlistId', '=', searchQuery.watchlistId)
    .where('chain', '=', searchQuery.chain)

  if (searchQuery.type) {
    query = query.where('type', '=', searchQuery.type)
  }

  if (searchQuery.itemId) {
    query = query.where('itemId', '=', searchQuery.itemId)
  }

  const result = await query.executeTakeFirst()

  return result?.count || 0
}

export async function createWatchlistItem(params: WatchlistItemCreateParams, database: D1Database) {
  const db = createDB(database)

  const created = await db
    .insertInto('watchlistItem')
    .values({
      chain: params.chain,
      type: params.type,
      watchlistId: params.watchlistId,
      itemId: params.itemId,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await db
    .updateTable('watchlist')
    .set((eb) => ({ itemsCount: eb('itemsCount', '+', 1), updatedAt: sql`datetime('now')` }))
    .where('id', '=', params.watchlistId)
    .executeTakeFirstOrThrow()

  return created
}

export async function deleteWatchlistItem(
  params: Pick<WatchlistItemCreateParams, 'chain' | 'watchlistId' | 'itemId'>,
  database: D1Database,
) {
  const db = createDB(database)

  const deleteResult = await db
    .deleteFrom('watchlistItem')
    .where('chain', '=', params.chain)
    .where('watchlistId', '=', params.watchlistId)
    .where('itemId', '=', params.itemId)
    .executeTakeFirstOrThrow()

  if (deleteResult.numDeletedRows > 0) {
    await db
      .updateTable('watchlist')
      .set((eb) => ({ itemsCount: eb('itemsCount', '-', 1), updatedAt: sql`datetime('now')` }))
      .where('id', '=', params.watchlistId)
      .executeTakeFirstOrThrow()
  }
}
