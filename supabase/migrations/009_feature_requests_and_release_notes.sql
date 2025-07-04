-- Migration: Feature Requests and Release Notes tables

-- Table for user-submitted feature requests
CREATE TABLE IF NOT EXISTS feature_requests (
    id serial PRIMARY KEY,
    user_id uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending', -- e.g. pending, planned, in_progress, released, rejected
    upvotes integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);

-- Table for release notes (optional, for dynamic management)
CREATE TABLE IF NOT EXISTS release_notes (
    id serial PRIMARY KEY,
    version text NOT NULL,
    title text,
    highlights text,
    details text,
    released_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_release_notes_version ON release_notes(version); 