-- Calls service schema. Jitsi owns the media; this service owns session state.
CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY,
    room_name TEXT NOT NULL UNIQUE,
    jitsi_url TEXT NOT NULL,
    call_type TEXT NOT NULL,
    scope TEXT NOT NULL,
    status TEXT NOT NULL,
    created_by UUID NOT NULL,
    conversation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calls_user_recent
    ON call_sessions (created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status
    ON call_sessions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS call_participants (
    call_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    PRIMARY KEY (call_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_call_participants_user
    ON call_participants (user_id, status);
