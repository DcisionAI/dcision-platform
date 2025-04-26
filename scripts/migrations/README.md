# Database Migrations

This directory contains SQL migration files for the DcisionAI platform's Supabase database.

## Migration Files

- `001_create_mcps_table.sql`: Creates the initial MCPs table with indexes and timestamps

## How to Apply Migrations

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of each migration file
4. Paste into the SQL Editor
5. Execute the SQL statements in order (001, 002, etc.)

## Schema Overview

### MCPs Table

The `mcps` table stores Model-Context-Protocol (MCP) objects with the following structure:

- `id`: UUID primary key
- `session_id`: Unique identifier for the session
- `version`: Schema version
- `created`: Timestamp when the MCP was created
- `last_modified`: Timestamp when the MCP was last modified
- `status`: Current status (draft, pending, processing, completed, error)
- `model`: JSON object containing the model definition
- `context`: JSON object containing the context information
- `protocol`: JSON object containing the protocol steps
- `created_at`: Automatic timestamp for record creation
- `updated_at`: Automatic timestamp for record updates

### Indexes

- `mcps_session_id_idx`: Index on session_id for faster lookups
- `mcps_status_idx`: Index on status for filtering

### Timestamps

The table includes automatic timestamp management:
- `created_at`: Set automatically when a record is created
- `updated_at`: Updated automatically via trigger whenever a record is modified

## Adding New Migrations

1. Create a new SQL file with the next sequential number (e.g., `002_...sql`)
2. Include both "up" and "down" migrations if possible
3. Test the migration in a development environment
4. Document any breaking changes or required actions
5. Update this README with the new migration details 