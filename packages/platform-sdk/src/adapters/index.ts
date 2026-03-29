import type { Platform, PlatformAdapter } from "../types";
import { FacebookAdapter } from "./facebook";

// Adapters added progressively — remaining platforms follow same pattern
const adapters: Partial<Record<Platform, () => PlatformAdapter>> = {
  FACEBOOK: () => new FacebookAdapter(),
};

export function getAdapter(platform: Platform): PlatformAdapter {
  const factory = adapters[platform];
  if (!factory) {
    throw new Error(`No adapter implemented for platform: ${platform}`);
  }
  return factory();
}

export function isAdapterAvailable(platform: Platform): boolean {
  return platform in adapters;
}
