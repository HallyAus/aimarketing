import type { TemplateProps } from "./types";

export default function TemplateAnnouncement({
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

  const headlineFontSize = Math.round(width * (isBold ? 0.062 : isElegant ? 0.048 : 0.055));
  const subtextFontSize = Math.round(width * (isMinimal ? 0.022 : 0.026));
  const brandFontSize = Math.round(width * 0.02);
  const ctaFontSize = Math.round(width * 0.024);
  const ctaPadV = Math.round(height * 0.022);
  const ctaPadH = Math.round(width * 0.055);

  // Decorative circle sizes driven by mood
  const bigCircleSize = Math.round(width * (isMinimal ? 0.3 : isPlayful ? 0.42 : 0.36));
  const smallCircleSize = Math.round(width * (isMinimal ? 0.15 : isPlayful ? 0.22 : 0.18));
  const circleOpacity = isMinimal ? 0.06 : isElegant ? 0.08 : isWarm ? 0.12 : 0.14;

  const headlineFontWeight = isBold ? 900 : isElegant ? 300 : isPlayful ? 800 : isMinimal ? 400 : 700;
  const letterSpacing = isElegant ? "0.08em" : isMinimal ? "0.04em" : isBold ? "-0.01em" : "0";

  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top-left decorative circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(bigCircleSize * 0.35),
          left: -Math.round(bigCircleSize * 0.35),
          width: bigCircleSize,
          height: bigCircleSize,
          borderRadius: "50%",
          background: "#ffffff",
          opacity: circleOpacity,
        }}
      />

      {/* Bottom-right decorative circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(bigCircleSize * 0.35),
          right: -Math.round(bigCircleSize * 0.35),
          width: bigCircleSize,
          height: bigCircleSize,
          borderRadius: "50%",
          background: "#ffffff",
          opacity: circleOpacity,
        }}
      />

      {/* Top-right small circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: Math.round(height * 0.06),
          right: Math.round(width * 0.06),
          width: smallCircleSize,
          height: smallCircleSize,
          borderRadius: "50%",
          background: accentColor,
          opacity: isMinimal ? 0.15 : 0.25,
        }}
      />

      {/* Bottom-left small circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: Math.round(height * 0.1),
          left: Math.round(width * 0.06),
          width: Math.round(smallCircleSize * 0.65),
          height: Math.round(smallCircleSize * 0.65),
          borderRadius: "50%",
          background: "#ffffff",
          opacity: isMinimal ? 0.1 : 0.18,
        }}
      />

      {/* Content stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "80%",
          gap: Math.round(height * 0.028),
        }}
      >
        {/* Pill label above headline for bold/playful */}
        {(isBold || isPlayful) && cta && (
          <div
            style={{
              display: "flex",
              background: accentColor,
              borderRadius: 999,
              paddingTop: Math.round(height * 0.01),
              paddingBottom: Math.round(height * 0.01),
              paddingLeft: Math.round(width * 0.032),
              paddingRight: Math.round(width * 0.032),
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: Math.round(width * 0.018),
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {isPlayful ? "🎉 " : ""}ANNOUNCEMENT
            </span>
          </div>
        )}

        {/* Headline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: headlineFontSize,
              fontWeight: headlineFontWeight,
              letterSpacing,
              textAlign: "center",
              lineHeight: isBold ? 1.1 : isElegant ? 1.35 : 1.2,
              textShadow: isBold ? "0 2px 16px rgba(0,0,0,0.25)" : "none",
            }}
          >
            {headline}
          </span>
        </div>

        {/* Elegant divider */}
        {isElegant && (
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.12),
              height: 1,
              background: "rgba(255,255,255,0.5)",
            }}
          />
        )}

        {/* Subtext */}
        {subtext && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: subtextFontSize,
                fontWeight: isElegant ? 300 : 400,
                textAlign: "center",
                lineHeight: 1.5,
                letterSpacing: isElegant ? "0.04em" : "0",
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
              marginTop: Math.round(height * 0.01),
            }}
          >
            <div
              style={{
                display: "flex",
                background: isMinimal ? "rgba(255,255,255,0.15)" : accentColor,
                borderRadius: 999,
                paddingTop: ctaPadV,
                paddingBottom: ctaPadV,
                paddingLeft: ctaPadH,
                paddingRight: ctaPadH,
                border: isMinimal ? "1.5px solid rgba(255,255,255,0.5)" : "none",
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

      {/* Brand name */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.04),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: brandFontSize,
              fontWeight: isElegant ? 300 : 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {brandName}
          </span>
        </div>
      )}
    </div>
  );
}
