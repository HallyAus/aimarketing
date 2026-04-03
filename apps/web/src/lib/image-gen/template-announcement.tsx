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

  const pad = Math.round(width * 0.08);

  // Headline is the hero — massive and attention-grabbing
  const headlineFontSize = Math.round(width * (isBold ? 0.085 : isElegant ? 0.065 : 0.075));
  // Subtext is readable but secondary
  const subtextFontSize = Math.round(width * (isMinimal ? 0.032 : 0.036));
  // Brand name has its own presence
  const brandFontSize = Math.round(width * 0.028);
  const ctaFontSize = Math.round(width * 0.032);
  const ctaPadV = Math.round(height * 0.03);
  const ctaPadH = Math.round(width * 0.07);

  // Bigger, more visible decorative circles
  const bigCircleSize = Math.round(width * (isMinimal ? 0.55 : isPlayful ? 0.65 : 0.6));
  const smallCircleSize = Math.round(width * (isMinimal ? 0.28 : isPlayful ? 0.35 : 0.3));
  // Increased opacity for visible decorative elements
  const circleOpacity = isMinimal ? 0.12 : isElegant ? 0.15 : isWarm ? 0.2 : 0.22;

  const headlineFontWeight = isBold ? 900 : isElegant ? 300 : isPlayful ? 800 : isMinimal ? 400 : 700;
  const letterSpacing = isElegant ? "0.06em" : isMinimal ? "0.03em" : isBold ? "-0.02em" : "-0.01em";

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
      {/* Top-left decorative circle — large and visible */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(bigCircleSize * 0.4),
          left: -Math.round(bigCircleSize * 0.4),
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
          bottom: -Math.round(bigCircleSize * 0.4),
          right: -Math.round(bigCircleSize * 0.4),
          width: bigCircleSize,
          height: bigCircleSize,
          borderRadius: "50%",
          background: "#ffffff",
          opacity: circleOpacity,
        }}
      />

      {/* Top-right accent circle — colored, punchy */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: Math.round(height * 0.04),
          right: Math.round(width * 0.04),
          width: smallCircleSize,
          height: smallCircleSize,
          borderRadius: "50%",
          background: accentColor,
          opacity: isMinimal ? 0.25 : 0.38,
        }}
      />

      {/* Bottom-left white circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: Math.round(height * 0.08),
          left: Math.round(width * 0.04),
          width: Math.round(smallCircleSize * 0.55),
          height: Math.round(smallCircleSize * 0.55),
          borderRadius: "50%",
          background: "#ffffff",
          opacity: isMinimal ? 0.15 : 0.25,
        }}
      />

      {/* Accent bar across bottom — adds urgency/brand stripe */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          width,
          height: Math.round(height * 0.012),
          background: accentColor,
        }}
      />

      {/* Content stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: width - pad * 2,
          gap: Math.round(height * 0.032),
          zIndex: 1,
        }}
      >
        {/* Pill badge — high contrast, uppercase, bold */}
        {cta && (
          <div
            style={{
              display: "flex",
              background: accentColor,
              borderRadius: 999,
              paddingTop: Math.round(height * 0.013),
              paddingBottom: Math.round(height * 0.013),
              paddingLeft: Math.round(width * 0.04),
              paddingRight: Math.round(width * 0.04),
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: Math.round(width * 0.024),
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {isPlayful ? "🎉 " : ""}ANNOUNCEMENT
            </span>
          </div>
        )}

        {/* MASSIVE headline — the hero element */}
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
              lineHeight: isBold ? 1.05 : isElegant ? 1.25 : 1.1,
              textShadow: isBold ? "0 3px 24px rgba(0,0,0,0.3)" : isPlayful ? "0 2px 16px rgba(0,0,0,0.2)" : "none",
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
              width: Math.round(width * 0.15),
              height: 2,
              background: accentColor,
              opacity: 0.8,
            }}
          />
        )}

        {/* Subtext — max 2 lines, readable size */}
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
                color: "rgba(255,255,255,0.88)",
                fontSize: subtextFontSize,
                fontWeight: isElegant ? 300 : 500,
                textAlign: "center",
                lineHeight: 1.45,
                letterSpacing: isElegant ? "0.04em" : "0",
              }}
            >
              {subtext}
            </span>
          </div>
        )}

        {/* CTA Button — large, high contrast */}
        {cta && (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(height * 0.012),
            }}
          >
            <div
              style={{
                display: "flex",
                background: isMinimal ? "rgba(255,255,255,0.2)" : "#ffffff",
                borderRadius: 999,
                paddingTop: ctaPadV,
                paddingBottom: ctaPadV,
                paddingLeft: ctaPadH,
                paddingRight: ctaPadH,
                border: isMinimal ? "2px solid rgba(255,255,255,0.6)" : "none",
              }}
            >
              <span
                style={{
                  color: isMinimal ? "#ffffff" : palette[0],
                  fontSize: ctaFontSize,
                  fontWeight: 800,
                  letterSpacing: isElegant ? "0.05em" : "0.01em",
                }}
              >
                {cta}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Brand name — bottom center, visible pill treatment */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.045),
            flexDirection: "row",
            alignItems: "center",
            gap: Math.round(width * 0.012),
            background: "rgba(0,0,0,0.22)",
            borderRadius: 999,
            paddingTop: Math.round(height * 0.009),
            paddingBottom: Math.round(height * 0.009),
            paddingLeft: Math.round(width * 0.028),
            paddingRight: Math.round(width * 0.028),
          }}
        >
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.01),
              height: Math.round(width * 0.01),
              borderRadius: "50%",
              background: accentColor,
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.9)",
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
    </div>
  );
}
