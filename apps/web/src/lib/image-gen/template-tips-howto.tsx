import type { TemplateProps } from "./types";

export default function TemplateTipsHowto({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const { headline, subtext, steps = [], palette, accentColor, brandName, mood } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";

  const headlineFontSize = isBold ? 42 : isMinimal ? 32 : 36;
  const borderRadius = isPlayful ? 24 : isElegant ? 4 : 12;
  const circleBorderRadius = isPlayful ? 9999 : isElegant ? 4 : 9999;
  const stepFontSize = isBold ? 18 : isMinimal ? 14 : 16;
  const stepFontWeight = isBold ? 700 : 400;
  const stepSpacing = isElegant ? 28 : isMinimal ? 20 : 24;
  const padding = isElegant ? 64 : isMinimal ? 56 : 48;
  const bgOpacity = isMinimal ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.12)";
  const textColor = "#ffffff";
  const subtleText = isMinimal ? "#555555" : "rgba(255,255,255,0.75)";

  const displaySteps = steps.slice(0, 5);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        background: isMinimal
          ? "#f8f8f8"
          : `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        fontFamily: "Inter, sans-serif",
        padding,
        justifyContent: "space-between",
        borderRadius,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {subtext && (
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: isMinimal ? accentColor : "rgba(255,255,255,0.6)",
            }}
          >
            {subtext}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: headlineFontSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 700,
            color: isMinimal ? "#1a1a1a" : textColor,
            lineHeight: 1.2,
            letterSpacing: isElegant ? -1 : 0,
          }}
        >
          {headline}
        </div>
        {/* Separator line */}
        <div
          style={{
            display: "flex",
            width: isMinimal ? 48 : 64,
            height: isElegant ? 1 : 3,
            background: accentColor,
            marginTop: 8,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: stepSpacing,
          flex: 1,
          marginTop: 32,
          marginBottom: 24,
        }}
      >
        {displaySteps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            {/* Number circle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isElegant ? 28 : 36,
                height: isElegant ? 28 : 36,
                borderRadius: circleBorderRadius,
                background: isMinimal ? accentColor : isBold ? accentColor : "rgba(255,255,255,0.25)",
                border: isElegant ? `1px solid ${accentColor}` : "none",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: isElegant ? 13 : 15,
                  fontWeight: 700,
                  color: isMinimal ? "#ffffff" : isElegant ? accentColor : textColor,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>

            {/* Step text */}
            <div
              style={{
                display: "flex",
                flex: 1,
                fontSize: stepFontSize,
                fontWeight: stepFontWeight,
                color: isMinimal ? "#2a2a2a" : textColor,
                lineHeight: 1.5,
                paddingTop: 6,
              }}
            >
              {step}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              color: subtleText,
              letterSpacing: 1,
            }}
          >
            {brandName}
          </div>
        )}
        {/* Decorative dots */}
        <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              style={{
                display: "flex",
                width: j === 0 ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: j === 0
                  ? accentColor
                  : isMinimal
                  ? "rgba(0,0,0,0.2)"
                  : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
