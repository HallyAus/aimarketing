import type { TemplateProps } from "./types";

export default function TemplateBrandStory({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const {
    headline,
    subtext,
    brandName,
    brandTagline,
    palette,
    accentColor,
    mood,
  } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";

  // Warm/editorial style as default
  const padding = isElegant ? 80 : isMinimal ? 72 : 64;
  const headlineFontSize = isBold ? 48 : isElegant ? 52 : isMinimal ? 38 : 44;
  const subtextFontSize = isMinimal ? 16 : isElegant ? 19 : 17;
  const borderRadius = isPlayful ? 24 : isElegant ? 2 : 12;

  // Color scheme
  const useLight = isMinimal || isWarm;
  const bgColor = useLight
    ? isWarm
      ? `linear-gradient(160deg, #fff8f0, #fff0e0)`
      : "#fafafa"
    : `linear-gradient(160deg, ${palette[0]}, ${palette[1]})`;
  const headlineColor = useLight ? "#1a1a1a" : "#ffffff";
  const bodyColor = useLight ? "#3a3a3a" : "rgba(255,255,255,0.82)";
  const mutedColor = useLight ? "#aaaaaa" : "rgba(255,255,255,0.45)";
  const separatorColor = useLight ? accentColor : "rgba(255,255,255,0.3)";

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
      }}
    >
      {/* Top accent stripe */}
      <div
        style={{
          display: "flex",
          height: isBold ? 6 : 3,
          background: accentColor,
          width: "100%",
          flexShrink: 0,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingLeft: padding,
          paddingRight: padding,
          paddingTop: isElegant ? 72 : 56,
          paddingBottom: 0,
          justifyContent: "flex-start",
        }}
      >
        {/* Small eyebrow label */}
        <div
          style={{
            display: "flex",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: useLight ? accentColor : "rgba(255,255,255,0.5)",
            marginBottom: 20,
          }}
        >
          {isWarm ? "Our Story" : isMinimal ? "Brand" : "About Us"}
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineFontSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : isMinimal ? 600 : 700,
            color: headlineColor,
            lineHeight: 1.15,
            letterSpacing: isElegant ? -2.5 : isBold ? -1 : -0.5,
            marginBottom: isElegant ? 40 : 32,
          }}
        >
          {headline}
        </div>

        {/* Decorative line separator */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: isElegant ? 40 : 32,
          }}
        >
          <div
            style={{
              display: "flex",
              width: isBold ? 56 : isMinimal ? 32 : 40,
              height: isElegant ? 1 : 2,
              background: separatorColor,
              borderRadius: 1,
            }}
          />
          <div
            style={{
              display: "flex",
              width: isElegant ? 4 : 6,
              height: isElegant ? 4 : 6,
              borderRadius: 9999,
              background: accentColor,
            }}
          />
          <div
            style={{
              display: "flex",
              width: isElegant ? 24 : 20,
              height: isElegant ? 1 : 2,
              background: separatorColor,
              opacity: 0.5,
              borderRadius: 1,
            }}
          />
        </div>

        {/* Body text */}
        {subtext && (
          <div
            style={{
              display: "flex",
              fontSize: subtextFontSize,
              fontWeight: isElegant ? 300 : 400,
              color: bodyColor,
              lineHeight: isElegant ? 1.9 : 1.7,
              letterSpacing: isElegant ? 0.3 : 0,
              maxWidth: "88%",
            }}
          >
            {subtext}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: isElegant ? 56 : 44,
          paddingTop: 28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {brandName && (
            <div
              style={{
                display: "flex",
                fontSize: isBold ? 16 : 14,
                fontWeight: 700,
                color: useLight ? "#1a1a1a" : "#ffffff",
                letterSpacing: 0.5,
              }}
            >
              {brandName}
            </div>
          )}
          {brandTagline && (
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: 400,
                color: mutedColor,
                letterSpacing: 0.3,
                fontStyle: isElegant ? "italic" : "normal",
              }}
            >
              {brandTagline}
            </div>
          )}
        </div>

        {/* Decorative flourish */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            alignItems: "flex-end",
          }}
        >
          {[isMinimal ? 32 : 48, 28, 16].map((w, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: w,
                height: isElegant ? 1 : 2,
                background: i === 0 ? accentColor : separatorColor,
                opacity: i === 0 ? 1 : 0.4,
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
