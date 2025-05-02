#!/bin/bash

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Error: Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
fi

# Start the service
echo "Starting DcisionAI Airbyte service..."
NODE_ENV=development \
  PORT=3000 \
  SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  SUPABASE_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  npm run dev 