import type { ColumnType } from 'kysely'

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>

export interface Watchlist {
  address: string
  createdAt: Generated<string>
  id: Generated<number>
  itemsCount: Generated<number>
  name: string
  publicId: string
  updatedAt: Generated<string>
}

export interface WatchlistItem {
  chain: string
  createdAt: Generated<string>
  id: Generated<number>
  itemId: string
  type: string
  updatedAt: Generated<string>
  watchlistId: number
}

export interface DB {
  watchlist: Watchlist
  watchlistItem: WatchlistItem
}
