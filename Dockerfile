FROM redis:7-alpine

# Install additional tools
RUN apk add --no-cache curl

# Copy configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Expose port
EXPOSE 6379

# Start Redis
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
