-- Create enum for connector types
CREATE TYPE connector_type AS ENUM ('postgres', 'mysql', 'mongodb', 'api');

-- Create connectors table
CREATE TABLE IF NOT EXISTS connectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type connector_type NOT NULL,
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX connectors_user_id_idx ON connectors(user_id);

-- Create RLS policies
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connectors"
    ON connectors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connectors"
    ON connectors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connectors"
    ON connectors FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connectors"
    ON connectors FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_connectors_updated_at
    BEFORE UPDATE ON connectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 