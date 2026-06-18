-- Indonesian holidays calendar for working-day SLA calculation
CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    year INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)) STORED,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'api-hari-libur')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_holidays_year ON holidays(year);
CREATE INDEX idx_holidays_date ON holidays(date);

-- Enable RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view holidays
CREATE POLICY "holidays_select_all"
    ON holidays FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only head_it can insert
CREATE POLICY "holidays_insert_admin"
    ON holidays FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'head_it'
        )
    );

-- Only head_it can update
CREATE POLICY "holidays_update_admin"
    ON holidays FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'head_it'
        )
    );

-- Only head_it can delete
CREATE POLICY "holidays_delete_admin"
    ON holidays FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'head_it'
        )
    );
