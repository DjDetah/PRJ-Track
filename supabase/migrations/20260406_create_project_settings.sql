CREATE TABLE IF NOT EXISTS project_settings (
    project_name TEXT PRIMARY KEY,
    client_price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    supplier_price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON project_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for all authenticated users" ON project_settings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for all authenticated users" ON project_settings
    FOR UPDATE TO authenticated USING (true);
