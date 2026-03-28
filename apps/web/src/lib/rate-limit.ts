import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "./redis";

export const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:auth",
  points: 5,
  duration: 60,
});

export const apiRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:api",
  points: 100,
  duration: 60,
});
