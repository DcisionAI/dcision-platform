# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install Java for openapi-generator-cli
RUN apk add --no-cache openjdk11

# Install dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Generate SDK from OpenAPI spec
RUN cd packages/sdk-js && yarn install --frozen-lockfile && yarn generate

# Build the Next.js application
RUN yarn build

# 2. Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
RUN yarn install --production --frozen-lockfile

# Copy built application and config
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["yarn", "start"] 