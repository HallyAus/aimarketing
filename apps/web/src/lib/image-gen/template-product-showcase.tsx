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

  const heroHeight = Math.round(height * 0.42);
  const contentHeight = height - heroHeight;

  const headlineFontSize = Math.round(width * (isBold ? 0.052 : isElegant ? 0.04 : 0.046));
  const subtextFontSize = Math.round(width * 0.024);
  const brandFontSize = Math.round(width * 0.019);
  const ctaFontSize = Math.round(width * 0.022);
  const ctaPadV = Math.round(height * 0.02);
  const ctaPadH = Math.round(width * 0.045);

  // Shapes in the hero zone
  const mainCircleSize = Math.round(heroHeight * (isBold ? 0.95 : isElegant ? 0.75 : 0.85));
  const circle2Size = Math.round(heroHeight * (isPlayful ? 0.6 : 0.5));
  const circle3Size = Math.round(heroHeight * (isPlayful ? 0.35 : 0.28));

  const contentBg = isMinimal
    ? "#ffffff"
    : isWarm
      ? "#fffaf6"
      : isElegant
        ? "#fafafa"
        : "#ffffff";

  const headlineColor = isMinimal
    ? "#111111"
    : isElegant
      ? "#1a1a1a"
      : isWarm
        ? "#2d1a0e"
        : "#0f0f0f";

  const subtextColor = isMinimal ? "#666666" : isWarm ? "#7a5c44" : "#555555";

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
      {/* ── Hero zone (top 42%) ─────────────────────────────────── */}
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
        {/* Brand name top-left in hero */}
        {brandName && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: Math.round(heroHeight * 0.1),
              left: Math.round(width * 0.06),
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: brandFontSize,
                fontWeight: isElegant ? 300 : 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {brandName}
            </span>
          </div>
        )}

        {/* Main large circle — centered, creates "product glow" */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            width: mainCircleSize,
            height: mainCircleSize,
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 38%, rgba(255,255,255,${isMinimal ? 0.18 : 0.25}), rgba(255,255,255,0.03))`,
            border: `${Math.round(width * 0.003)}px solid rgba(255,255,255,${isMinimal ? 0.1 : 0.18})`,
          }}
        />

        {/* Secondary circle — offset top-right */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -Math.round(circle2Size * 0.3),
            right: -Math.round(circle2Size * 0.2),
            width: circle2Size,
            height: circle2Size,
            borderRadius: "50%",
            background: accentColor,
            opacity: isMinimal ? 0.12 : isElegant ? 0.15 : isWarm ? 0.22 : 0.2,
          }}
        />

        {/* Tertiary small circle — bottom-left accent */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(heroHeight * 0.1),
            left: Math.round(width * 0.08),
            width: circle3Size,
            height: circle3Size,
            borderRadius: "50%",
            background: "#ffffff",
            opacity: isMinimal ? 0.07 : isPlayful ? 0.2 : 0.1,
          }}
        />

        {/* Playful: extra small accent circles */}
        {isPlayful && (
          <>
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: Math.round(heroHeight * 0.12),
                left: Math.round(width * 0.18),
                width: Math.round(circle3Size * 0.4),
                height: Math.round(circle3Size * 0.4),
                borderRadius: "50%",
                background: accentColor,
                opacity: 0.35,
              }}
            />
            <div
              style={{
                display: "flex",
                position: "absolute",
                bottom: Math.round(heroHeight * 0.15),
                right: Math.round(width * 0.15),
                width: Math.round(circle3Size * 0.55),
                height: Math.round(circle3Size * 0.55),
                borderRadius: "50%",
                background: "#ffffff",
                opacity: 0.25,
              }}
            />
          </>
        )}

        {/* Warm: organic blob ring overlay */}
        {isWarm && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: -Math.round(heroHeight * 0.15),
              left: "20%",
              width: Math.round(width * 0.6),
              height: Math.round(heroHeight * 0.5),
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
        )}

        {/* Elegant: thin ring inside main circle */}
        {isElegant && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              width: Math.round(mainCircleSize * 0.7),
              height: Math.round(mainCircleSize * 0.7),
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,0.2)`,
            }}
          />
        )}

        {/* Bold: thick bottom border accent */}
        {isBold && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: 0,
              left: 0,
              width,
              height: Math.round(heroHeight * 0.018),
              background: accentColor,
            }}
          />
        )}
      </div>

      {/* ── Content zone (bottom 58%) ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          width,
          height: contentHeight,
          background: contentBg,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: Math.round(width * 0.08),
          paddingRight: Math.round(width * 0.08),
          gap: Math.round(contentHeight * 0.06),
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Accent mark left edge */}
        {!isMinimal && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 0,
              top: "20%",
              width: Math.round(width * 0.006),
              height: "60%",
              background: accentColor,
              opacity: isElegant ? 0.4 : 0.7,
              borderRadius: "0 4px 4px 0",
            }}
          />
        )}

        {/* Headline */}
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
                fontWeight: isBold ? 900 : isElegant ? 300 : isMinimal ? 400 : 700,
                lineHeight: isBold ? 1.1 : 1.25,
                letterSpacing: isBold ? "-0.02em" : isElegant ? "0.04em" : "0",
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Subtext */}
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
                lineHeight: 1.55,
                letterSpacing: isElegant ? "0.02em" : "0",
              }}
            >
              {subtext}
            </span>
          </div>
        )}

        {/* CTA Button */}
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
                borderRadius: isPlayful ? 999 : isElegant ? 2 : Math.round(width * 0.012),
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
                  fontWeight: isElegant ? 400 : 700,
                  letterSpacing: isElegant ? "0.06em" : "0.01em",
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
