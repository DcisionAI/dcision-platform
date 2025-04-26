-- Create MCPs table
CREATE TABLE mcps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  created TIMESTAMP WITH TIME ZONE NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'processing', 'completed', 'error')),
  model JSONB NOT NULL,
  context JSONB NOT NULL,
  protocol JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on session_id for faster lookups
CREATE INDEX mcps_session_id_idx ON mcps(session_id);

-- Create index on status for filtering
CREATE INDEX mcps_status_idx ON mcps(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_mcps_updated_at
  BEFORE UPDATE ON mcps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 