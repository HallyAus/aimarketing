export interface AspectRatio {
  label: string;
  value: string;
  width: number;
  height: number;
}

export interface PlatformMediaSpec {
  formats: string[];
  maxSizeMB: number;
  ratios: AspectRatio[];
  notes?: string;
}

export const PLATFORM_MEDIA_SPECS: Record<string, PlatformMediaSpec> = {
  FACEBOOK: {
    formats: ["image/jpeg", "image/png"],
    maxSizeMB: 10,
    ratios: [
      { label: "1:1", value: "1:1", width: 1, height: 1 },
      { label: "1.91:1", value: "1.91:1", width: 1.91, height: 1 },
      { label: "4:5", value: "4:5", width: 4, height: 5 },
      { label: "9:16", value: "9:16", width: 9, height: 16 },
    ],
  },
  INSTAGRAM: {
    formats: ["image/jpeg", "image/png"],
    maxSizeMB: 8,
    ratios: [
      { label: "1:1", value: "1:1", width: 1, height: 1 },
      { label: "4:5", value: "4:5", width: 4, height: 5 },
      { label: "1.91:1", value: "1.91:1", width: 1.91, height: 1 },
      { label: "9:16", value: "9:16", width: 9, height: 16 },
    ],
  },
  LINKEDIN: {
    formats: ["image/jpeg", "image/png"],
    maxSizeMB: 5,
    ratios: [
      { label: "1:1", value: "1:1", width: 1, height: 1 },
      { label: "1.91:1", value: "1.91:1", width: 1.91, height: 1 },
      { label: "2:3", value: "2:3", width: 2, height: 3 },
      { label: "9:16", value: "9:16", width: 9, height: 16 },
    ],
  },
  TWITTER_X: {
    formats: ["image/jpeg", "image/png", "image/gif"],
    maxSizeMB: 5,
    ratios: [
      { label: "1:1", value: "1:1", width: 1, height: 1 },
      { label: "16:9", value: "16:9", width: 16, height: 9 },
      { label: "2:1", value: "2:1", width: 2, height: 1 },
    ],
    notes: "GIF max 15MB",
  },
  PINTEREST: {
    formats: ["image/jpeg", "image/png"],
    maxSizeMB: 20,
    ratios: [
      { label: "2:3", value: "2:3", width: 2, height: 3 },
      { label: "1:1", value: "1:1", width: 1, height: 1 },
    ],
  },
  TIKTOK: {
    formats: ["video/mp4"],
    maxSizeMB: 287,
    ratios: [
      { label: "9:16", value: "9:16", width: 9, height: 16 },
    ],
    notes: "Video only (MP4)",
  },
  YOUTUBE: {
    formats: ["image/jpeg", "image/png"],
    maxSizeMB: 2,
    ratios: [
      { label: "16:9", value: "16:9", width: 16, height: 9 },
    ],
  },
  SNAPCHAT: {
    formats: ["image/jpeg", "image/png", "video/mp4"],
    maxSizeMB: 5,
    ratios: [
      { label: "9:16", value: "9:16", width: 9, height: 16 },
    ],
    notes: "Images max 5MB, videos max 32MB",
  },
  GOOGLE_ADS: {
    formats: ["image/jpeg", "image/png"],
    maxSizeMB: 5,
    ratios: [
      { label: "1.91:1", value: "1.91:1", width: 1.91, height: 1 },
      { label: "1:1", value: "1:1", width: 1, height: 1 },
      { label: "4:5", value: "4:5", width: 4, height: 5 },
    ],
  },
};

/** Tolerance for aspect ratio matching (5%) */
const RATIO_TOLERANCE = 0.05;

/**
 * Check if image dimensions match any of the allowed ratios for a platform.
 * Returns the matched ratio label or null.
 */
export function matchAspectRatio(
  width: number,
  height: number,
  ratios: AspectRatio[],
): AspectRatio | null {
  const imageRatio = width / height;
  for (const ratio of ratios) {
    const targetRatio = ratio.width / ratio.height;
    if (Math.abs(imageRatio - targetRatio) / targetRatio <= RATIO_TOLERANCE) {
      return ratio;
    }
  }
  return null;
}

/**
 * Get effective max file size for a platform + MIME type combo.
 * Handles special cases like Twitter GIFs and Snapchat videos.
 */
export function getEffectiveMaxSizeMB(platform: string, mimeType: string): number {
  if (platform === "TWITTER_X" && mimeType === "image/gif") return 15;
  if (platform === "SNAPCHAT" && mimeType === "video/mp4") return 32;
  return PLATFORM_MEDIA_SPECS[platform]?.maxSizeMB ?? 5;
}

/**
 * Format accepted file extensions for display.
 */
export function formatAcceptedTypes(formats: string[]): string {
  const map: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "video/mp4": "MP4",
  };
  return formats.map((f) => map[f] ?? f).join(", ");
}
