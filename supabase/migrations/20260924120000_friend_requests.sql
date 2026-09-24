-- Friend requests table for SplitX
-- Allows users to send, accept, reject, cancel friend requests
-- Reciprocal friend entries are created on acceptance via application logic

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_no_self_request CHECK (requester_id <> addressee_id)
);

-- Partial unique index to prevent duplicate pending requests in the same direction
CREATE UNIQUE INDEX uq_friend_requests_pending_direction
    ON friend_requests (requester_id, addressee_id)
    WHERE status = 'pending';

-- Indexes for common query patterns
CREATE INDEX idx_friend_requests_requester_status
    ON friend_requests (requester_id, status);
CREATE INDEX idx_friend_requests_addressee_status
    ON friend_requests (addressee_id, status);
CREATE INDEX idx_friend_requests_created_at
    ON friend_requests (created_at DESC);

-- Optional: trigger to auto-update updated_at (not used elsewhere, manual updates in API)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- CREATE TRIGGER update_friend_requests_updated_at
-- BEFORE UPDATE ON friend_requests
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();