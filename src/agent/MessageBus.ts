import Redis from 'ioredis';
// If you see type errors for ioredis, run: npm install --save-dev @types/ioredis

type Message = { type: string; payload: any; correlationId?: string; from?: string; to?: string };
type Handler = (msg: Message) => void;

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

let pub: Redis | null = null;
let sub: Redis | null = null;
let redisAvailable = false;

// Initialize Redis with better error handling
if (REDIS_HOST) {
  try {
    const redisConfig = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      connectTimeout: 5000, // 5 second timeout
      maxRetriesPerRequest: 3, // Reduce retries
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true, // Don't connect immediately
    };

    pub = new Redis(redisConfig);
    sub = new Redis(redisConfig);

    // Test connection
    pub.ping().then(() => {
      console.log('✅ Redis connection established');
      redisAvailable = true;
    }).catch((err: Error) => {
      console.warn('⚠️ Redis connection failed, falling back to in-memory:', err.message);
      redisAvailable = false;
      pub = null;
      sub = null;
    });

    // Handle connection errors
    pub.on('error', (err: Error) => {
      console.warn('Redis publisher error:', err.message);
      redisAvailable = false;
    });

    sub.on('error', (err: Error) => {
      console.warn('Redis subscriber error:', err.message);
      redisAvailable = false;
    });

  } catch (err) {
    console.warn('⚠️ Failed to initialize Redis, falling back to in-memory:', err);
    redisAvailable = false;
    pub = null;
    sub = null;
  }
}

// Global subscription registry to prevent duplicates
const subscriptionRegistry = new Set<string>();

export function isSubscribed(eventType: string, agentName: string): boolean {
  const key = `${eventType}:${agentName}`;
  return subscriptionRegistry.has(key);
}

export function markSubscribed(eventType: string, agentName: string): void {
  const key = `${eventType}:${agentName}`;
  subscriptionRegistry.add(key);
}

class RedisMessageBus {
  private handlers: { [type: string]: Handler[] } = {};
  private fallbackBus: any;

  constructor() {
    // Initialize fallback bus
    this.fallbackBus = {
      handlers: {},
      subscribe(type: string, handler: Handler) {
        if (!this.handlers[type]) this.handlers[type] = [];
        this.handlers[type].push(handler);
      },
      publish(msg: Message) {
        (this.handlers[msg.type] || []).forEach((h: Handler) => h(msg));
      }
    };

    // Set up Redis message handler if subscriber client exists
    if (sub) {
      sub.on('message', (channel: string, message: string) => {
        try {
          const msg: Message = JSON.parse(message);
          (this.handlers[channel] || []).forEach((h: Handler) => h(msg));
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });
    }
  }

  subscribe(type: string, handler: Handler) {
    if (sub) {
      try {
        if (!this.handlers[type]) {
          this.handlers[type] = [];
          sub.subscribe(type);
        }
        this.handlers[type].push(handler);
      } catch (err) {
        console.warn('Redis subscribe failed, using fallback:', (err as Error).message);
        this.fallbackBus.subscribe(type, handler);
      }
    } else {
      this.fallbackBus.subscribe(type, handler);
    }
  }
  /**
   * Remove a previously registered handler for a message type
   */
  unsubscribe(type: string, handler: Handler) {
    // If using Redis subscription
    if (sub) {
      const list = this.handlers[type];
      if (list) {
        const idx = list.indexOf(handler);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
        // If no more handlers, unsubscribe from Redis channel
        if (list.length === 0) {
          try {
            sub.unsubscribe(type);
          } catch (err: any) {
            console.warn('Redis unsubscribe failed:', err.message);
          }
        }
      }
    } else {
      // Fallback bus unsubscribe
      const fb: any = this.fallbackBus;
      const list = fb.handlers[type];
      if (list) {
        const idx = list.indexOf(handler);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
      }
    }
  }

  publish(msg: Message) {
    if (pub) {
      try {
        pub.publish(msg.type, JSON.stringify(msg));
      } catch (err) {
        console.warn('Redis publish failed, using fallback:', (err as Error).message);
        this.fallbackBus.publish(msg);
      }
    } else {
      this.fallbackBus.publish(msg);
    }
  }

  // Get connection status
  getStatus() {
    return {
      redisAvailable,
      redisHost: REDIS_HOST,
      redisPort: REDIS_PORT,
      fallbackMode: !redisAvailable
    };
  }
}

export const messageBus = new RedisMessageBus(); 