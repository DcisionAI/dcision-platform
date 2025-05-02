#!/bin/bash

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found"
    exit 1
fi

# Create secrets from .env.local
while IFS='=' read -r key value
do
    # Skip empty lines and comments
    if [ -z "$key" ] || [[ $key == \#* ]]; then
        continue
    fi
    
    # Clean up key and value
    key=$(echo $key | tr -d ' ')
    value=$(echo $value | tr -d ' ' | tr -d '"' | tr -d "'")
    
    if [ ! -z "$value" ]; then
        echo "Creating/updating secret: $key"
        # Create secret if it doesn't exist
        gcloud secrets create $key --replication-policy="automatic" 2>/dev/null || true
        # Add new version with value
        echo -n "$value" | gcloud secrets versions add $key --data-file=-
    fi
done < .env.local

echo "Secrets created successfully!" 