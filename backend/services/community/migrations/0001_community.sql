CREATE TABLE IF NOT EXISTS lost_and_found (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    owner_username TEXT NOT NULL,
    description TEXT NOT NULL,
    college TEXT NOT NULL,
    image_url TEXT,
    phone_number TEXT,
    kind TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lost_found_recent
    ON lost_and_found (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS lost_and_found_claims (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES lost_and_found(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL,
    claimant_username TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    reporter_username TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
