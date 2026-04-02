import { getPlatformTheme, getPlatformLabel } from "@/lib/platform-colors";

type PlatformBadgeSize = "sm" | "md";

const SIZE_CLASSES: Record<PlatformBadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function PlatformBadge({
  platform,
  size = "sm",
}: {
  platform: string;
  size?: PlatformBadgeSize;
}) {
  const theme = getPlatformTheme(platform);
  const label = getPlatformLabel(platform);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${SIZE_CLASSES[size]}`}
      style={{ background: theme.bg, color: theme.text }}
    >
      {label}
    </span>
  );
}
