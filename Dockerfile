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

# Expose port
EXPOSE 3000

# Start the development server with hot reloading
CMD ["yarn", "dev"]

# Production stage
FROM node:20-alpine AS production

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts

# Copy Supabase functions separately
COPY supabase/functions ./supabase/functions

# Make initialization script executable
RUN chmod +x /app/scripts/init-customer-db.sh

# Set runtime environment variables
ENV NODE_ENV=production
# All secrets and runtime env vars are set at runtime, not build time
EXPOSE 3000

# Start the application and initialize database
CMD ["/bin/sh", "-c", "/app/scripts/init-customer-db.sh && yarn start"] 