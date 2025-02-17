CREATE TABLE watchlist (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT NOT NULL,
    public_id    TEXT         NOT NULL UNIQUE,
    name         TEXT         NOT NULL,
    address      TEXT         NOT NULL,
    items_count  INTEGER      NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE watchlist_item (
    id           INTEGER        PRIMARY KEY AUTOINCREMENT NOT NULL,
    chain        CHAR(10)       NOT NULL,
    type         CHAR(10)       NOT NULL,
    watchlist_id INTEGER        NOT NULL,
    item_id      TEXT           NOT NULL,
    created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (watchlist_id)  REFERENCES watchlist (id),
    unique      (chain, watchlist_id, item_id)
);
