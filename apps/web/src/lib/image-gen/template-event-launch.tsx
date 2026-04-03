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

  const padding = isElegant ? 64 : 48;
  const borderRadius = isPlayful ? 24 : isElegant ? 4 : 16;
  const dateBadgeRadius = isPlayful ? 20 : isElegant ? 4 : 12;
  const ctaRadius = isPlayful ? 9999 : isElegant ? 4 : 8;
  const headlineFontSize = isBold ? 52 : isMinimal ? 36 : isElegant ? 44 : 46;
  const textColor = "#ffffff";
  const mutedText = "rgba(255,255,255,0.7)";

  // Decorative ray lines — simulated with narrow divs at angles using a flex row
  // We approximate a starburst with 6 thin bars arranged around the date badge
  const rayCount = isPlayful ? 8 : isMinimal ? 4 : 6;
  const rayColor = isMinimal
    ? "rgba(255,255,255,0.08)"
    : isBold
    ? "rgba(255,255,255,0.15)"
    : "rgba(255,255,255,0.1)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        fontFamily: "Inter, sans-serif",
        borderRadius,
        overflow: "hidden",
      }}
    >
      {/* Decorative rays layer — top-left origin radiating bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: isPlayful ? 14 : 18,
          width: "100%",
          height: 8,
          paddingLeft: padding,
          paddingTop: padding - 8,
          flexWrap: "nowrap",
          alignItems: "flex-end",
        }}
      >
        {Array.from({ length: rayCount }).map((_, i) => {
          const widths = [80, 48, 64, 36, 72, 28, 56, 40];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                height: 3,
                width: widths[i % widths.length],
                background: rayColor,
                borderRadius: 2,
              }}
            />
          );
        })}
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Date badge */}
        {eventDate && (
          <div style={{ display: "flex", marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 10,
                paddingBottom: 10,
                background: accentColor,
                borderRadius: dateBadgeRadius,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: isBold ? 15 : 13,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {eventDate}
              </div>
            </div>
          </div>
        )}

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineFontSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 700,
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: isElegant ? -2 : isBold ? -1 : 0,
            marginBottom: 20,
          }}
        >
          {headline}
        </div>

        {/* Subtext */}
        {subtext && (
          <div
            style={{
              display: "flex",
              fontSize: isMinimal ? 15 : 17,
              fontWeight: 400,
              color: mutedText,
              lineHeight: 1.5,
              marginBottom: 32,
              maxWidth: "80%",
            }}
          >
            {subtext}
          </div>
        )}

        {/* Decorative line */}
        <div
          style={{
            display: "flex",
            width: isBold ? 80 : 48,
            height: isBold ? 4 : 2,
            background: accentColor,
            borderRadius: 2,
            marginBottom: 32,
          }}
        />

        {/* CTA button */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: isBold ? 40 : 32,
              paddingRight: isBold ? 40 : 32,
              paddingTop: isBold ? 18 : 14,
              paddingBottom: isBold ? 18 : 14,
              background: isMinimal ? "rgba(255,255,255,0.15)" : "#ffffff",
              borderRadius: ctaRadius,
              border: isElegant ? "1px solid rgba(255,255,255,0.4)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: isBold ? 17 : 15,
                fontWeight: 700,
                color: isMinimal ? "#ffffff" : palette[0],
                letterSpacing: 0.5,
              }}
            >
              {cta ?? "Register Now"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: 24,
          paddingTop: 12,
        }}
      >
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 1,
            }}
          >
            {brandName}
          </div>
        )}
        {/* Starburst dots row */}
        <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }}>
          {Array.from({ length: isPlayful ? 5 : 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: i % 2 === 0 ? 8 : 4,
                height: i % 2 === 0 ? 8 : 4,
                borderRadius: 9999,
                background: i === 0 ? accentColor : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
