# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install Java for OpenAPI generator
RUN apk add --no-cache openjdk17-jre

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code, excluding Supabase functions
COPY . .
RUN rm -rf supabase/functions

# Install devDependencies and generate SDK code
RUN cd packages/sdk-js && yarn install --frozen-lockfile && yarn generate

# Set build-time environment variables for public values only
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# Pass-through build args (no defaults) to be picked up by Next.js at build time
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the application
RUN yarn build:prod

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Set development environment variables
ENV NODE_ENV=development
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:54321}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}

# Expose port
EXPOSE 3000

# Start the development server with hot reloading
CMD ["yarn", "dev"]

# Production stage
FROM node:20-alpine AS production

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Add build args and env for Supabase config
# Pass-through build args for runtime inspection (though binding happened at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

## Copy built application artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

## Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# (Optional) Copy runtime scripts if needed
# COPY scripts/init-customer-db.sh ./scripts/

# Set runtime environment variables
ENV NODE_ENV=production
# All secrets and runtime env vars are set at runtime, not build time
EXPOSE 8080

# Start the application
CMD ["yarn", "start"] 