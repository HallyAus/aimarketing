import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

function getRedisClient(): IORedis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(
      process.env.REDIS_URL ?? "redis://localhost:6379",
      { maxRetriesPerRequest: null }
    );
  }
  return globalForRedis.redis;
}

// Lazy proxy — doesn't connect until first method call
export const redis = new Proxy({} as IORedis, {
  get(_target, prop, receiver) {
    const client = getRedisClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
