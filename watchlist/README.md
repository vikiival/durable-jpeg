# watchlist API

## Overview

- `GET    /watchlists` - list all watchlists
- `POST   /watchlists` - create watchlist
- `GET    /watchlists/:id` - get one watchlist
- `PUT    /watchlists/:id` - update one watchlist (only name can be updated for now)
- `DELETE /watchlists/:id` - delete watchlist
-
- `GET    /watchlists/:id/chains/:chain_id/items` - list items in watchlist
- `POST   /watchlists/:id/chains/:chain_id/items` - add to watchlist
- `GET    /watchlists/:id/chains/:chain_id/items/:item_id/exists` - check if item exists in watchlist
- `DELETE /watchlists/:id/chains/:chain_id/items/:item_id` - remove from watchlist
