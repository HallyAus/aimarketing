import type { TemplateProps } from "./types";

export default function TemplateCarouselCard({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const {
    headline,
    subtext,
    cta,
    metric,
    palette,
    accentColor,
    brandName,
    mood,
  } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";

  // --- Sizing ---
  const pad = Math.round(width * (isElegant ? 0.09 : 0.075));
  const borderRadius = isPlayful ? Math.round(width * 0.055) : isElegant ? 4 : Math.round(width * 0.03);
  const badgeRadius = isPlayful ? Math.round(width * 0.025) : isElegant ? 6 : Math.round(width * 0.014);
  const ctaRadius = isPlayful ? 9999 : isElegant ? 4 : Math.round(width * 0.012);

  const numberBadgeSize = Math.round(width * (isBold ? 0.16 : 0.14));
  const numberFontSize = Math.round(width * (isBold ? 0.07 : 0.06));
  const headlineSize = Math.round(width * (isBold ? 0.082 : isElegant ? 0.072 : isMinimal ? 0.062 : 0.075));
  const subtextSize = Math.round(width * 0.034);
  const ctaFontSize = Math.round(width * 0.032);
  const brandSize = Math.round(width * 0.025);
  const dotCount = 5;

  // Slide number from metric field or default "01"
  const slideNumber =
    metric && /^\d+$/.test(metric.trim())
      ? String(Number(metric)).padStart(2, "0")
      : "01";
  const activeDot = (Number(slideNumber) - 1) % dotCount;

  // --- Colors ---
  const useLight = isMinimal;
  const bg = useLight
    ? "#f7f7f7"
    : `linear-gradient(145deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
  const textColor = useLight ? "#111111" : "#ffffff";
  const mutedText = useLight ? "#777777" : "rgba(255,255,255,0.65)";

  // Decorative background circle
  const decorSize = Math.round(width * 0.65);

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
        paddingLeft: pad,
        paddingRight: pad,
        paddingTop: pad,
        paddingBottom: pad,
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      {/* ── BACKGROUND DECORATION ── */}
      {/* Large ghost circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(decorSize * 0.4),
          right: -Math.round(decorSize * 0.3),
          width: decorSize,
          height: decorSize,
          borderRadius: 9999,
          background: useLight ? accentColor : "rgba(255,255,255,0.06)",
          opacity: useLight ? 0.05 : 1,
        }}
      />
      {/* Ring */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(decorSize * 0.25),
          left: -Math.round(decorSize * 0.25),
          width: Math.round(decorSize * 0.8),
          height: Math.round(decorSize * 0.8),
          borderRadius: 9999,
          border: `${Math.round(width * 0.004)}px solid ${useLight ? accentColor : "rgba(255,255,255,0.08)"}`,
          opacity: 0.2,
        }}
      />

      {/* ── TOP ROW: large number badge + brand ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        {/* Large number badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: numberBadgeSize,
            height: numberBadgeSize,
            background: accentColor,
            borderRadius: badgeRadius,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: numberFontSize,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            {slideNumber}
          </div>
        </div>

        {/* Brand name */}
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: brandSize,
              fontWeight: 700,
              color: mutedText,
              letterSpacing: Math.round(width * 0.001),
              paddingTop: Math.round(width * 0.01),
            }}
          >
            {brandName}
          </div>
        )}
      </div>

      {/* ── CENTER CONTENT ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: Math.round(height * 0.025),
          paddingTop: Math.round(height * 0.03),
          paddingBottom: Math.round(height * 0.03),
          zIndex: 1,
        }}
      >
        {/* Top accent bar — centered above headline */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isBold ? 0.14 : 0.1)),
            height: isBold ? 5 : 3,
            background: accentColor,
            borderRadius: 2,
          }}
        />

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 800,
            color: textColor,
            lineHeight: 1.15,
            letterSpacing: isElegant ? -2 : isBold ? -1.5 : -0.5,
            textAlign: "center",
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
              fontWeight: isElegant ? 300 : 400,
              color: mutedText,
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: "80%",
            }}
          >
            {subtext}
          </div>
        )}

        {/* CTA */}
        {cta && (
          <div style={{ display: "flex", marginTop: Math.round(height * 0.01) }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: Math.round(width * 0.065),
                paddingRight: Math.round(width * 0.065),
                paddingTop: Math.round(height * 0.025),
                paddingBottom: Math.round(height * 0.025),
                background: useLight ? accentColor : "#ffffff",
                borderRadius: ctaRadius,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: ctaFontSize,
                  fontWeight: 800,
                  color: useLight ? "#ffffff" : palette[0],
                  letterSpacing: 0.5,
                }}
              >
                {cta}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM: swipe indicator dots ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(width * (isPlayful ? 0.014 : 0.01)),
          zIndex: 1,
        }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const isActive = i === activeDot;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                width: isActive
                  ? Math.round(width * (isPlayful ? 0.065 : 0.05))
                  : Math.round(width * (isPlayful ? 0.016 : 0.012)),
                height: Math.round(width * (isPlayful ? 0.016 : 0.012)),
                borderRadius: 9999,
                background: isActive
                  ? accentColor
                  : useLight
                  ? "rgba(0,0,0,0.18)"
                  : "rgba(255,255,255,0.3)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
