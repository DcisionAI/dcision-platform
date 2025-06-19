# Build stage
FROM node:20-alpine AS builder

# Install Python and pip for Agno backend
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Install Java for OpenAPI generator
RUN apk add --no-cache openjdk17-jre

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Copy agno-package directory first (needed for yarn install)
COPY agno-package/ ./agno-package/

# Install Node.js dependencies
RUN yarn install --frozen-lockfile

# Copy Python requirements and install Agno backend dependencies
COPY agno-backend/requirements.txt ./agno-backend/
RUN pip3 install --break-system-packages -r agno-backend/requirements.txt

# Copy remaining source code
COPY . .

# Install devDependencies and generate SDK code
RUN cd packages/sdk-js && yarn install --frozen-lockfile && yarn generate

# Build the application
RUN yarn build:prod

# Development stage
FROM node:20-alpine AS development

# Install Python and pip for Agno backend
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Copy agno-package directory first (needed for yarn install)
COPY agno-package/ ./agno-package/

# Install Node.js dependencies
RUN yarn install

# Copy Python requirements and install Agno backend dependencies
COPY agno-backend/requirements.txt ./agno-backend/
RUN pip3 install --break-system-packages -r agno-backend/requirements.txt

# Copy remaining source code
COPY . .

# Set development environment variables
ENV NODE_ENV=development

# Expose ports for both services
EXPOSE 3000 8000

# Start both services in development mode
CMD ["sh", "-c", "python3 agno-backend/main.py & yarn dev"]

# Production stage
FROM node:20-alpine AS production

# Install Python, pip, and PostgreSQL client
RUN apk add --no-cache python3 py3-pip postgresql-client

WORKDIR /app

## Copy built application artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

## Install only production dependencies
COPY package.json yarn.lock ./
COPY agno-package/ ./agno-package/
RUN yarn install --production --frozen-lockfile

## Copy Agno backend and install Python dependencies
COPY agno-backend/ ./agno-backend/
RUN pip3 install --break-system-packages -r agno-backend/requirements.txt

# Copy startup script
COPY scripts/start-production.sh ./scripts/
COPY scripts/verify-highs-mcp.js ./scripts/
COPY scripts/verify-single-service.js ./scripts/
RUN chmod +x ./scripts/start-production.sh

# Set runtime environment variables
ENV NODE_ENV=production
# All secrets and runtime env vars are set at runtime, not build time
EXPOSE 8080 8000

# Start both services using the startup script
CMD ["./scripts/start-production.sh"] 