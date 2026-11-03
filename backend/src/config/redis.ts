import "dotenv/config";
import { createClient } from "redis";
import { EventEmitter } from "node:events";

const redisUrl = process.env.REDIS_URL;

class InMemoryRedisClient extends EventEmitter {
  isReady = true;
  private static channelListeners = new Map<string, Set<(message: string) => void>>();

  async connect(): Promise<void> {
    this.isReady = true;
  }

  async publish(channel: string, message: string): Promise<number> {
    const listeners = InMemoryRedisClient.channelListeners.get(channel);
    if (!listeners || listeners.size === 0) return 0;
    listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error("InMemoryRedis subscriber error:", err);
      }
    });
    return listeners.size;
  }

  async subscribe(channel: string, listener: (message: string) => void): Promise<void> {
    if (!InMemoryRedisClient.channelListeners.has(channel)) {
      InMemoryRedisClient.channelListeners.set(channel, new Set());
    }
    InMemoryRedisClient.channelListeners.get(channel)!.add(listener);
  }

  duplicate(): InMemoryRedisClient {
    return new InMemoryRedisClient();
  }
}

let realPublisher: ReturnType<typeof createClient> | null = null;
let realSubscriber: ReturnType<typeof createClient> | null = null;
const mockPublisher = new InMemoryRedisClient();
const mockSubscriber = mockPublisher.duplicate();

let useMock = !redisUrl;

if (redisUrl) {
  try {
    realPublisher = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 200, 3000),
      },
    });
    realSubscriber = realPublisher.duplicate();

    realPublisher.on("error", (error) => {
      console.warn("[FleetDash] Redis publisher error (using mock fallback):", error.message);
      useMock = true;
    });

    realSubscriber.on("error", (error) => {
      console.warn("[FleetDash] Redis subscriber error (using mock fallback):", error.message);
      useMock = true;
    });
  } catch {
    useMock = true;
  }
} else {
  console.info("[FleetDash] REDIS_URL not provided — using in-memory pub/sub");
}

export const redisPublisher = new Proxy(mockPublisher as any, {
  get(_target, prop) {
    if (!useMock && realPublisher && realPublisher.isReady) {
      const val = (realPublisher as any)[prop];
      if (typeof val === "function") return val.bind(realPublisher);
      return val;
    }
    const val = (mockPublisher as any)[prop];
    if (typeof val === "function") return val.bind(mockPublisher);
    return val;
  },
});

export const redisSubscriber = new Proxy(mockSubscriber as any, {
  get(_target, prop) {
    if (!useMock && realSubscriber && realSubscriber.isReady) {
      const val = (realSubscriber as any)[prop];
      if (typeof val === "function") return val.bind(realSubscriber);
      return val;
    }
    const val = (mockSubscriber as any)[prop];
    if (typeof val === "function") return val.bind(mockSubscriber);
    return val;
  },
});

export async function connectRedis(): Promise<void> {
  if (useMock || !realPublisher || !realSubscriber) {
    await mockPublisher.connect();
    await mockSubscriber.connect();
    console.log("[FleetDash] In-memory Redis pub/sub active");
    return;
  }

  try {
    await Promise.all([realPublisher.connect(), realSubscriber.connect()]);
    console.log("Redis Cloud connected");
  } catch (err) {
    console.warn("[FleetDash] Failed connecting to real Redis, switching to in-memory pub/sub:", err instanceof Error ? err.message : err);
    useMock = true;
  }
}