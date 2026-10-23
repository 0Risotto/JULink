-- Search read model. Populated from identity/content internal APIs.
CREATE TABLE IF NOT EXISTS search_users (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    search_vector TSVECTOR NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_search_users_vector
    ON search_users USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS search_posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL,
    author_username TEXT NOT NULL,
    body TEXT NOT NULL,
    hashtags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    search_vector TSVECTOR NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_search_posts_vector
    ON search_posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_search_posts_created
    ON search_posts (created_at DESC);
