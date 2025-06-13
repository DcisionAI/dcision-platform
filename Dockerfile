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

# Copy source code
COPY . .

# Install devDependencies and generate SDK code
RUN cd packages/sdk-js && yarn install --frozen-lockfile && yarn generate

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

## Copy built application artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

## Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Set runtime environment variables
ENV NODE_ENV=production
# All secrets and runtime env vars are set at runtime, not build time
EXPOSE 8080

# Start the application
CMD ["yarn", "start"] 