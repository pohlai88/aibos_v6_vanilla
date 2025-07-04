-- Migration: Create search_index and search_exclusions tables for global search and admin config exclusions

-- Table for global search index (summary info only, no RLS)
CREATE TABLE IF NOT EXISTS search_index (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    summary text,
    url text,
    tags text,
    icon text,
    is_sensitive boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table for admin-configured search exclusions
CREATE TABLE IF NOT EXISTS search_exclusions (
    id serial PRIMARY KEY,
    keyword text,
    path_pattern text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- (Optional) Grant select to anon/authenticated for search_index (no RLS)
GRANT SELECT ON search_index TO anon, authenticated;

-- (Optional) Grant select/insert/update/delete to service_role for search_exclusions
GRANT SELECT, INSERT, UPDATE, DELETE ON search_exclusions TO service_role; 