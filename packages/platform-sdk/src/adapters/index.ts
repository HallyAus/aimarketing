import type { Platform, PlatformAdapter } from "../types";
import { FacebookAdapter } from "./facebook";
import { InstagramAdapter } from "./instagram";
import { TiktokAdapter } from "./tiktok";
import { LinkedinAdapter } from "./linkedin";
import { TwitterAdapter } from "./twitter";
import { YoutubeAdapter } from "./youtube";
import { GoogleAdsAdapter } from "./google-ads";
import { PinterestAdapter } from "./pinterest";
import { SnapchatAdapter } from "./snapchat";

const adapters: Record<Platform, () => PlatformAdapter> = {
  FACEBOOK: () => new FacebookAdapter(),
  INSTAGRAM: () => new InstagramAdapter(),
  TIKTOK: () => new TiktokAdapter(),
  LINKEDIN: () => new LinkedinAdapter(),
  TWITTER_X: () => new TwitterAdapter(),
  YOUTUBE: () => new YoutubeAdapter(),
  GOOGLE_ADS: () => new GoogleAdsAdapter(),
  PINTEREST: () => new PinterestAdapter(),
  SNAPCHAT: () => new SnapchatAdapter(),
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
