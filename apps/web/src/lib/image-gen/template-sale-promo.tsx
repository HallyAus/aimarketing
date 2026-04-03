import type { TemplateProps } from "./types";

export default function TemplateSalePromo({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const { headline, subtext, cta, brandName, metric, metricLabel, mood, palette, accentColor } =
    spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";

  const metricFontSize = Math.round(width * (isBold ? 0.14 : isElegant ? 0.1 : 0.12));
  const metricLabelFontSize = Math.round(width * (isBold ? 0.032 : 0.026));
  const headlineFontSize = Math.round(width * 0.028);
  const subtextFontSize = Math.round(width * 0.022);
  const brandFontSize = Math.round(width * 0.019);
  const ctaFontSize = Math.round(width * 0.024);
  const ctaPadV = Math.round(height * 0.022);
  const ctaPadH = Math.round(width * 0.05);

  // Diagonal stripe count & sizing
  const stripeCount = isBold ? 8 : isMinimal ? 4 : 6;
  const stripeWidth = Math.round(width * (isBold ? 0.048 : 0.032));
  const stripeOpacity = isMinimal ? 0.04 : isElegant ? 0.05 : isWarm ? 0.09 : 0.1;

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
      {/* Diagonal stripes overlay — purely decorative */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          flexDirection: "row",
          overflow: "hidden",
          opacity: stripeOpacity,
          transform: "rotate(-30deg) scaleX(2.5) translateX(-20%) translateY(-30%)",
        }}
      >
        {Array.from({ length: stripeCount }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              width: stripeWidth,
              height: height * 2.5,
              background: i % 2 === 0 ? "#ffffff" : "transparent",
              marginRight: stripeWidth * 1.2,
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Top accent bar */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: Math.round(height * 0.008),
          background: accentColor,
        }}
      />

      {/* Bottom accent bar */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          width,
          height: Math.round(height * 0.008),
          background: accentColor,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "85%",
          gap: Math.round(height * 0.018),
          zIndex: 1,
        }}
      >
        {/* "SALE" tag */}
        {(isBold || isPlayful) && (
          <div
            style={{
              display: "flex",
              background: accentColor,
              borderRadius: isPlayful ? 999 : 4,
              paddingTop: Math.round(height * 0.009),
              paddingBottom: Math.round(height * 0.009),
              paddingLeft: Math.round(width * 0.028),
              paddingRight: Math.round(width * 0.028),
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: Math.round(width * 0.017),
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {isPlayful ? "🔥 " : ""}LIMITED TIME OFFER
            </span>
          </div>
        )}

        {/* Huge metric */}
        {metric && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 0.9,
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: metricFontSize,
                fontWeight: isBold ? 900 : isElegant ? 200 : 800,
                letterSpacing: isBold ? "-0.03em" : isElegant ? "0.04em" : "-0.02em",
                textShadow: isBold
                  ? "0 4px 32px rgba(0,0,0,0.3)"
                  : isPlayful
                    ? `0 0 40px ${accentColor}99`
                    : "none",
              }}
            >
              {metric}
            </span>
          </div>
        )}

        {/* Metric label */}
        {metricLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isMinimal ? "rgba(255,255,255,0.12)" : accentColor,
              borderRadius: isPlayful ? 999 : isMinimal ? 4 : 2,
              paddingTop: Math.round(height * 0.011),
              paddingBottom: Math.round(height * 0.011),
              paddingLeft: Math.round(width * 0.038),
              paddingRight: Math.round(width * 0.038),
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: metricLabelFontSize,
                fontWeight: isElegant ? 400 : 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {metricLabel}
            </span>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isMinimal ? 0.08 : 0.18)),
            height: isElegant ? 1 : 2,
            background: "rgba(255,255,255,0.35)",
          }}
        />

        {/* Headline */}
        {headline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: headlineFontSize,
                fontWeight: isElegant ? 300 : 600,
                textAlign: "center",
                letterSpacing: isElegant ? "0.05em" : "0",
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
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: subtextFontSize,
                fontWeight: 400,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {subtext}
            </span>
          </div>
        )}

        {/* CTA */}
        {cta && (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(height * 0.008),
            }}
          >
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                borderRadius: 999,
                paddingTop: ctaPadV,
                paddingBottom: ctaPadV,
                paddingLeft: ctaPadH,
                paddingRight: ctaPadH,
              }}
            >
              <span
                style={{
                  color: palette[0],
                  fontSize: ctaFontSize,
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                }}
              >
                {cta}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Brand name — bottom right corner */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.04),
            right: Math.round(width * 0.05),
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: brandFontSize,
              fontWeight: 500,
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
