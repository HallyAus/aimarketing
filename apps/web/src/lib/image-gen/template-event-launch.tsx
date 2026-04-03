import type { TemplateProps } from "./types";

export default function TemplateEventLaunch({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const {
    headline,
    subtext,
    cta,
    eventDate,
    palette,
    accentColor,
    brandName,
    mood,
  } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";

  // --- Sizing (all relative to width) ---
  const pad = Math.round(width * 0.08);
  const headlineSize = Math.round(width * (isBold ? 0.085 : isMinimal ? 0.065 : isElegant ? 0.075 : 0.078));
  const subtextSize = Math.round(width * 0.034);
  const dateBadgeFontSize = Math.round(width * 0.032);
  const ctaFontSize = Math.round(width * 0.034);
  const brandSize = Math.round(width * 0.026);
  const borderRadius = isPlayful ? Math.round(width * 0.04) : isElegant ? 4 : Math.round(width * 0.02);
  const dateBadgeRadius = isPlayful ? Math.round(width * 0.025) : isElegant ? 4 : Math.round(width * 0.012);
  const ctaRadius = isPlayful ? 9999 : isElegant ? 4 : Math.round(width * 0.01);

  // --- Color scheme ---
  const bg = `linear-gradient(145deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
  const textColor = "#ffffff";
  const mutedText = "rgba(255,255,255,0.72)";

  // Large decorative circles — energetic feel
  const bigCircleSize = Math.round(width * 0.7);
  const medCircleSize = Math.round(width * 0.35);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        background: bg,
        fontFamily: "Inter, sans-serif",
        borderRadius,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── DECORATIVE LAYER ── */}
      {/* Large radial burst — bottom-right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(bigCircleSize * 0.35),
          right: -Math.round(bigCircleSize * 0.25),
          width: bigCircleSize,
          height: bigCircleSize,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.07)",
        }}
      />
      {/* Medium circle — top-right offset */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(medCircleSize * 0.3),
          right: Math.round(width * 0.05),
          width: medCircleSize,
          height: medCircleSize,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.10)",
        }}
      />
      {/* Accent-color glow blob — top-left */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(medCircleSize * 0.5),
          left: -Math.round(medCircleSize * 0.3),
          width: medCircleSize,
          height: medCircleSize,
          borderRadius: 9999,
          background: accentColor,
          opacity: 0.22,
        }}
      />
      {/* Thin diagonal accent bar */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: Math.round(height * 0.006),
          background: accentColor,
        }}
      />

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: pad,
          paddingBottom: Math.round(pad * 0.5),
          justifyContent: "center",
          gap: 0,
          zIndex: 1,
        }}
      >
        {/* Date badge — large and punchy */}
        {eventDate && (
          <div style={{ display: "flex", marginBottom: Math.round(height * 0.04) }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: Math.round(width * 0.04),
                paddingRight: Math.round(width * 0.04),
                paddingTop: Math.round(height * 0.022),
                paddingBottom: Math.round(height * 0.022),
                background: accentColor,
                borderRadius: dateBadgeRadius,
                gap: Math.round(width * 0.015),
              }}
            >
              {/* Calendar icon dot */}
              <div
                style={{
                  display: "flex",
                  width: Math.round(width * 0.018),
                  height: Math.round(width * 0.018),
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.6)",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: dateBadgeFontSize,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: Math.round(width * 0.002),
                  textTransform: "uppercase",
                }}
              >
                {eventDate}
              </div>
            </div>
          </div>
        )}

        {/* Headline — massive */}
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 800,
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: isElegant ? -2 : isBold ? -1.5 : -0.5,
            marginBottom: Math.round(height * 0.03),
          }}
        >
          {headline}
        </div>

        {/* Subtext */}
        {subtext && (
          <div
            style={{
              display: "flex",
              fontSize: subtextSize,
              fontWeight: 400,
              color: mutedText,
              lineHeight: 1.5,
              marginBottom: Math.round(height * 0.045),
              maxWidth: "75%",
            }}
          >
            {subtext}
          </div>
        )}

        {/* CTA button — prominent */}
        {cta && (
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: Math.round(width * 0.055),
                paddingRight: Math.round(width * 0.055),
                paddingTop: Math.round(height * 0.028),
                paddingBottom: Math.round(height * 0.028),
                background: "#ffffff",
                borderRadius: ctaRadius,
                gap: Math.round(width * 0.015),
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: ctaFontSize,
                  fontWeight: 800,
                  color: palette[0],
                  letterSpacing: 0.5,
                }}
              >
                {cta}
              </div>
              {/* Arrow indicator */}
              <div
                style={{
                  display: "flex",
                  width: Math.round(width * 0.024),
                  height: Math.round(width * 0.024),
                  borderRadius: 9999,
                  background: palette[0],
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.15,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(pad * 0.75),
          paddingTop: Math.round(pad * 0.3),
          zIndex: 1,
        }}
      >
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: brandSize,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: Math.round(width * 0.001),
              opacity: 0.9,
            }}
          >
            {brandName}
          </div>
        )}
        {/* Energy dots — playful accent row */}
        <div style={{ display: "flex", flexDirection: "row", gap: Math.round(width * 0.008), alignItems: "center" }}>
          {(isPlayful ? [10, 6, 10, 6, 10] : [10, 6, 10]).map((sz, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: Math.round(width * sz / 1000),
                height: Math.round(width * sz / 1000),
                borderRadius: 9999,
                background: i % 2 === 0 ? accentColor : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
