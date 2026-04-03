import type { TemplateProps } from "./types";

export default function TemplateProductShowcase({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const { headline, subtext, cta, brandName, mood, palette, accentColor } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";

  const heroHeight = Math.round(height * 0.44);
  const contentHeight = height - heroHeight;
  const contentPad = Math.round(width * 0.08);

  // Bigger headline — clear hierarchy
  const headlineFontSize = Math.round(width * (isBold ? 0.068 : isElegant ? 0.054 : 0.062));
  const subtextFontSize = Math.round(width * 0.032);
  const brandFontSize = Math.round(width * 0.026);
  const ctaFontSize = Math.round(width * 0.030);
  const ctaPadV = Math.round(height * 0.025);
  const ctaPadH = Math.round(width * 0.058);

  // Hero zone shapes — multiple overlapping gradients for visual richness
  const mainCircleSize = Math.round(heroHeight * (isBold ? 1.05 : isElegant ? 0.85 : 0.95));
  const circle2Size = Math.round(heroHeight * (isPlayful ? 0.72 : 0.62));
  const circle3Size = Math.round(heroHeight * (isPlayful ? 0.45 : 0.38));
  const circle4Size = Math.round(heroHeight * 0.28);

  const contentBg = isMinimal
    ? "#ffffff"
    : isWarm
      ? "#fffaf5"
      : isElegant
        ? "#fafafa"
        : "#ffffff";

  const headlineColor = isMinimal
    ? "#0f0f0f"
    : isElegant
      ? "#1a1a1a"
      : isWarm
        ? "#2d1a0e"
        : "#0a0a0a";

  const subtextColor = isMinimal ? "#555555" : isWarm ? "#7a5c44" : "#444444";

  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Hero zone (top 44%) ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          width,
          height: heroHeight,
          background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Brand name — top left, clearly readable */}
        {brandName && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: Math.round(heroHeight * 0.1),
              left: Math.round(width * 0.07),
              background: "rgba(0,0,0,0.2)",
              borderRadius: 999,
              paddingTop: Math.round(heroHeight * 0.05),
              paddingBottom: Math.round(heroHeight * 0.05),
              paddingLeft: Math.round(width * 0.028),
              paddingRight: Math.round(width * 0.028),
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: brandFontSize,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {brandName}
            </span>
          </div>
        )}

        {/* Main large circle — centered glow effect */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: mainCircleSize,
            height: mainCircleSize,
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 38%, rgba(255,255,255,${isMinimal ? 0.24 : 0.32}), rgba(255,255,255,0.04))`,
            border: `${Math.round(width * 0.004)}px solid rgba(255,255,255,${isMinimal ? 0.15 : 0.24})`,
          }}
        />

        {/* Second circle — top-right, accent colored, overlapping */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -Math.round(circle2Size * 0.28),
            right: -Math.round(circle2Size * 0.18),
            width: circle2Size,
            height: circle2Size,
            borderRadius: "50%",
            background: accentColor,
            opacity: isMinimal ? 0.18 : isElegant ? 0.2 : isWarm ? 0.28 : 0.28,
          }}
        />

        {/* Third circle — bottom-left, white, overlapping main */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -Math.round(circle3Size * 0.25),
            left: Math.round(width * 0.06),
            width: circle3Size,
            height: circle3Size,
            borderRadius: "50%",
            background: "#ffffff",
            opacity: isMinimal ? 0.12 : isPlayful ? 0.26 : 0.16,
          }}
        />

        {/* Fourth circle — mid-right, accent, small detail */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: Math.round(heroHeight * 0.55),
            right: Math.round(width * 0.1),
            width: circle4Size,
            height: circle4Size,
            borderRadius: "50%",
            background: accentColor,
            opacity: isMinimal ? 0.14 : 0.32,
          }}
        />

        {/* Fifth circle — top-left small accent dot */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: Math.round(heroHeight * 0.18),
            left: Math.round(width * 0.22),
            width: Math.round(circle4Size * 0.55),
            height: Math.round(circle4Size * 0.55),
            borderRadius: "50%",
            background: "#ffffff",
            opacity: isMinimal ? 0.1 : isPlayful ? 0.3 : 0.18,
          }}
        />

        {/* Playful: extra pop circles */}
        {isPlayful && (
          <>
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: Math.round(heroHeight * 0.1),
                right: Math.round(width * 0.28),
                width: Math.round(circle4Size * 0.45),
                height: Math.round(circle4Size * 0.45),
                borderRadius: "50%",
                background: accentColor,
                opacity: 0.45,
              }}
            />
            <div
              style={{
                display: "flex",
                position: "absolute",
                bottom: Math.round(heroHeight * 0.12),
                right: Math.round(width * 0.18),
                width: Math.round(circle4Size * 0.6),
                height: Math.round(circle4Size * 0.6),
                borderRadius: "50%",
                background: "#ffffff",
                opacity: 0.3,
              }}
            />
          </>
        )}

        {/* Elegant: concentric inner ring */}
        {isElegant && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              width: Math.round(mainCircleSize * 0.68),
              height: Math.round(mainCircleSize * 0.68),
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,0.28)`,
            }}
          />
        )}

        {/* Bold / all moods: thick bottom accent bar */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            width,
            height: Math.round(heroHeight * (isBold ? 0.024 : 0.016)),
            background: accentColor,
          }}
        />
      </div>

      {/* ── Content zone (bottom 56%) ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          width,
          height: contentHeight,
          background: contentBg,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: contentPad,
          paddingRight: contentPad,
          gap: Math.round(contentHeight * 0.065),
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Thick accent mark on left edge */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            top: "15%",
            width: Math.round(width * 0.009),
            height: "70%",
            background: accentColor,
            opacity: isElegant ? 0.5 : 0.85,
            borderRadius: "0 6px 6px 0",
          }}
        />

        {/* Headline — bold, clear hierarchy */}
        {headline && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                color: headlineColor,
                fontSize: headlineFontSize,
                fontWeight: isBold ? 900 : isElegant ? 300 : isMinimal ? 500 : 800,
                lineHeight: isBold ? 1.05 : 1.2,
                letterSpacing: isBold ? "-0.025em" : isElegant ? "0.04em" : "0",
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Subtext — readable size, concise */}
        {subtext && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                color: subtextColor,
                fontSize: subtextFontSize,
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: isElegant ? "0.02em" : "0",
              }}
            >
              {subtext}
            </span>
          </div>
        )}

        {/* CTA Button — large, high contrast, prominent */}
        {cta && (
          <div
            style={{
              display: "flex",
            }}
          >
            <div
              style={{
                display: "flex",
                background: accentColor,
                borderRadius: isPlayful ? 999 : isElegant ? 4 : Math.round(width * 0.014),
                paddingTop: ctaPadV,
                paddingBottom: ctaPadV,
                paddingLeft: ctaPadH,
                paddingRight: ctaPadH,
              }}
            >
              <span
                style={{
                  color: "#ffffff",
                  fontSize: ctaFontSize,
                  fontWeight: 800,
                  letterSpacing: isElegant ? "0.06em" : "0.015em",
                }}
              >
                {cta}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
