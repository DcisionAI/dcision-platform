# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
# Copy package files first to leverage Docker cache
COPY package*.json ./
COPY yarn.lock ./

# Install all dependencies, including devDependencies (needed for bundle-analyzer)
RUN yarn install --frozen-lockfile --production=false

COPY . .
# Copy source code
COPY . .

# Set production mode so Next.js loads .env.production
ENV NODE_ENV=production

# Build application
RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create public directory if it doesn't exist
RUN mkdir -p public

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 