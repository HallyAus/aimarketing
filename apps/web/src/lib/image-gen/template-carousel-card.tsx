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

  const padding = isElegant ? 56 : isMinimal ? 52 : 44;
  const borderRadius = isPlayful ? 28 : isElegant ? 4 : 16;
  const badgeRadius = isPlayful ? 12 : isElegant ? 4 : 8;
  const ctaRadius = isPlayful ? 9999 : isElegant ? 4 : 8;
  const headlineFontSize = isBold ? 46 : isElegant ? 42 : isMinimal ? 34 : 40;
  const dotCount = 5;

  // Slide number — pull from metric field if it looks like a number, else default to "01"
  const slideNumber =
    metric && /^\d+$/.test(metric.trim())
      ? String(Number(metric)).padStart(2, "0")
      : "01";

  const useLight = isMinimal;
  const textColor = useLight ? "#1a1a1a" : "#ffffff";
  const mutedText = useLight ? "#888888" : "rgba(255,255,255,0.6)";
  const bgColor = useLight
    ? "#f7f7f7"
    : `linear-gradient(145deg, ${palette[0]}, ${palette[1]})`;

  // Which dot is "active" — tied to slide number
  const activeDot = (Number(slideNumber) - 1) % dotCount;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        background: bgColor,
        fontFamily: "Inter, sans-serif",
        borderRadius,
        overflow: "hidden",
        paddingLeft: padding,
        paddingRight: padding,
        paddingTop: padding,
        paddingBottom: padding,
        justifyContent: "space-between",
      }}
    >
      {/* Top row: number badge + brand */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Number badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 8,
            paddingBottom: 8,
            background: accentColor,
            borderRadius: badgeRadius,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: isBold ? 16 : 14,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: 2,
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
              fontSize: 12,
              fontWeight: 600,
              color: mutedText,
              letterSpacing: 1,
            }}
          >
            {brandName}
          </div>
        )}
      </div>

      {/* Center content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: 20,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        {/* Decorative top mark */}
        <div
          style={{
            display: "flex",
            width: isBold ? 56 : 40,
            height: isBold ? 5 : 3,
            background: accentColor,
            borderRadius: 2,
            marginBottom: 8,
          }}
        />

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineFontSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 700,
            color: textColor,
            lineHeight: 1.15,
            letterSpacing: isElegant ? -2 : isBold ? -1 : -0.5,
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
              fontSize: isMinimal ? 15 : isElegant ? 17 : 16,
              fontWeight: isElegant ? 300 : 400,
              color: mutedText,
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: "82%",
            }}
          >
            {subtext}
          </div>
        )}

        {/* CTA */}
        {cta && (
          <div style={{ display: "flex", marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: isBold ? 36 : 28,
                paddingRight: isBold ? 36 : 28,
                paddingTop: isBold ? 16 : 12,
                paddingBottom: isBold ? 16 : 12,
                background: useLight ? accentColor : "#ffffff",
                borderRadius: ctaRadius,
                border: isElegant && !useLight ? `1.5px solid rgba(255,255,255,0.4)` : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: isBold ? 16 : 14,
                  fontWeight: 700,
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

      {/* Bottom row: navigation dots */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isPlayful ? 10 : 8,
        }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const isActive = i === activeDot;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                width: isActive ? (isPlayful ? 28 : 22) : (isPlayful ? 8 : 6),
                height: isPlayful ? 8 : 6,
                borderRadius: 9999,
                background: isActive
                  ? accentColor
                  : useLight
                  ? "rgba(0,0,0,0.15)"
                  : "rgba(255,255,255,0.25)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
