-- App Showcase table for System Development portfolio
CREATE TABLE IF NOT EXISTS app_showcase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name TEXT NOT NULL,
    description TEXT,
    screenshots TEXT[] DEFAULT '{}',
    platform TEXT NOT NULL DEFAULT 'android', -- android, ios, web, cross-platform
    play_store_url TEXT,
    app_store_url TEXT,
    demo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_showcase ENABLE ROW LEVEL SECURITY;

-- Public read access (for landing page)
CREATE POLICY "Public can view app_showcase"
    ON app_showcase FOR SELECT
    USING (true);

-- Authenticated users can insert/update/delete (admin enforced at app level)
CREATE POLICY "Authenticated users can manage app_showcase"
    ON app_showcase FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
