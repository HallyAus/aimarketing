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

  // Sizing — all relative to width for sharpness at any dimension
  const pad = Math.round(width * 0.08);
  const headlineSize = Math.round(width * (isBold ? 0.082 : isMinimal ? 0.065 : 0.074));
  const subtagSize = Math.round(width * 0.028);
  const stepTextSize = Math.round(width * 0.032);
  const circleSize = Math.round(width * 0.052);
  const circleNumSize = Math.round(width * 0.026);
  const brandSize = Math.round(width * 0.026);
  const separatorH = isBold ? 5 : isElegant ? 2 : 4;
  const borderRadius = isPlayful ? Math.round(width * 0.04) : isElegant ? 4 : Math.round(width * 0.02);
  const circleBorderRadius = isPlayful ? 9999 : isElegant ? 6 : 9999;

  // Limit to 4 steps for visual clarity
  const displaySteps = steps.slice(0, 4);

  const isLight = isMinimal;
  const bg = isLight
    ? "#f5f5f5"
    : `linear-gradient(145deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
  const textColor = isLight ? "#111111" : "#ffffff";
  const subtleColor = isLight ? "#666666" : "rgba(255,255,255,0.65)";
  const circleTextColor = "#ffffff";
  const circleBg = accentColor;
  const stepCardBg = isLight
    ? "rgba(0,0,0,0.05)"
    : "rgba(255,255,255,0.10)";

  // Large decorative circle — background accent
  const decorSize = Math.round(width * 0.55);

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
      {/* Decorative background circle — large, low-opacity */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(decorSize * 0.3),
          right: -Math.round(decorSize * 0.3),
          width: decorSize,
          height: decorSize,
          borderRadius: 9999,
          background: accentColor,
          opacity: isLight ? 0.07 : 0.14,
        }}
      />
      {/* Secondary smaller circle bottom-left */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(decorSize * 0.2),
          left: -Math.round(decorSize * 0.15),
          width: Math.round(decorSize * 0.6),
          height: Math.round(decorSize * 0.6),
          borderRadius: 9999,
          background: isLight ? accentColor : palette[1],
          opacity: isLight ? 0.05 : 0.18,
        }}
      />

      {/* Header area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: pad,
          gap: Math.round(width * 0.012),
        }}
      >
        {/* Eyebrow tag */}
        {subtext && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              paddingLeft: Math.round(width * 0.022),
              paddingRight: Math.round(width * 0.022),
              paddingTop: Math.round(width * 0.01),
              paddingBottom: Math.round(width * 0.01),
              background: isLight ? accentColor : "rgba(255,255,255,0.18)",
              borderRadius: isElegant ? 4 : Math.round(width * 0.008),
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: subtagSize,
                fontWeight: 700,
                letterSpacing: Math.round(width * 0.003),
                textTransform: "uppercase",
                color: isLight ? "#ffffff" : "#ffffff",
              }}
            >
              {subtext}
            </div>
          </div>
        )}

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: isBold ? 900 : isElegant ? 400 : 800,
            color: textColor,
            lineHeight: 1.15,
            letterSpacing: isElegant ? -1 : isBold ? -1.5 : -0.5,
          }}
        >
          {headline}
        </div>

        {/* Accent separator */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * 0.1),
            height: separatorH,
            background: accentColor,
            borderRadius: 3,
            marginTop: Math.round(width * 0.008),
          }}
        />
      </div>

      {/* Steps list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: Math.round(width * 0.04),
          paddingBottom: Math.round(width * 0.02),
          gap: Math.round(width * 0.025),
          justifyContent: "center",
        }}
      >
        {displaySteps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: Math.round(width * 0.028),
              background: stepCardBg,
              borderRadius: isElegant ? 6 : Math.round(width * 0.014),
              paddingLeft: Math.round(width * 0.024),
              paddingRight: Math.round(width * 0.024),
              paddingTop: Math.round(width * 0.018),
              paddingBottom: Math.round(width * 0.018),
            }}
          >
            {/* Large number circle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: circleSize,
                height: circleSize,
                minWidth: circleSize,
                borderRadius: circleBorderRadius,
                background: circleBg,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: circleNumSize,
                  fontWeight: 800,
                  color: circleTextColor,
                  letterSpacing: -0.5,
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
                fontSize: stepTextSize,
                fontWeight: isBold ? 700 : isElegant ? 400 : 600,
                color: textColor,
                lineHeight: 1.4,
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
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(pad * 0.75),
        }}
      >
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: brandSize,
              fontWeight: 700,
              color: isLight ? "#111111" : "#ffffff",
              letterSpacing: Math.round(width * 0.001),
              opacity: 0.85,
            }}
          >
            {brandName}
          </div>
        )}
        {/* Accent dot row */}
        <div style={{ display: "flex", flexDirection: "row", gap: Math.round(width * 0.008), alignItems: "center" }}>
          {[1, 0, 0].map((active, j) => (
            <div
              key={j}
              style={{
                display: "flex",
                width: active ? Math.round(width * 0.04) : Math.round(width * 0.01),
                height: Math.round(width * 0.01),
                borderRadius: 9999,
                background: active ? accentColor : subtleColor,
                opacity: active ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
