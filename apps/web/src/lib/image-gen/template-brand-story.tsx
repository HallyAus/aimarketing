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

  // --- Sizing ---
  const pad = Math.round(width * (isElegant ? 0.1 : 0.08));
  const headlineSize = Math.round(width * (isBold ? 0.082 : isElegant ? 0.076 : isMinimal ? 0.065 : 0.072));
  const eyebrowSize = Math.round(width * 0.025);
  const bodySize = Math.round(width * 0.034);
  const brandNameSize = Math.round(width * 0.036);
  const taglineSize = Math.round(width * 0.024);
  const topStripeH = isBold ? Math.round(height * 0.012) : Math.round(height * 0.006);
  const borderRadius = isPlayful ? Math.round(width * 0.04) : isElegant ? 4 : Math.round(width * 0.02);

  // --- Colors ---
  const useLight = isMinimal || isWarm;
  const bg = useLight
    ? isWarm
      ? `linear-gradient(160deg, #fff8f0, #fff0e0)`
      : "#fafafa"
    : `linear-gradient(160deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
  const headlineColor = useLight ? "#111111" : "#ffffff";
  const bodyColor = useLight ? "#333333" : "rgba(255,255,255,0.85)";
  const mutedColor = useLight ? "#888888" : "rgba(255,255,255,0.5)";
  const eyebrowColor = useLight ? accentColor : "rgba(255,255,255,0.6)";
  const brandColor = useLight ? "#111111" : "#ffffff";

  // Decorative line lengths
  const line1W = Math.round(width * (isBold ? 0.1 : 0.07));
  const line2W = Math.round(width * 0.04);

  // Background decorative element
  const decorCircleSize = Math.round(width * 0.45);

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
      {/* ── DECORATIVE BACKGROUND ── */}
      {/* Subtle large circle — opposite corner from text */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(decorCircleSize * 0.3),
          right: -Math.round(decorCircleSize * 0.2),
          width: decorCircleSize,
          height: decorCircleSize,
          borderRadius: 9999,
          background: useLight ? accentColor : "rgba(255,255,255,0.06)",
          opacity: useLight ? 0.06 : 1,
        }}
      />
      {/* Thin concentric ring */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(decorCircleSize * 0.45),
          right: -Math.round(decorCircleSize * 0.35),
          width: Math.round(decorCircleSize * 1.4),
          height: Math.round(decorCircleSize * 1.4),
          borderRadius: 9999,
          border: `${Math.round(width * 0.003)}px solid ${useLight ? accentColor : "rgba(255,255,255,0.08)"}`,
          opacity: 0.15,
        }}
      />
      {/* Small dot cluster — top right */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            position: "absolute",
            top: Math.round(height * 0.08) + i * Math.round(width * 0.025),
            right: pad + i * Math.round(width * 0.012),
            width: Math.round(width * (i === 0 ? 0.012 : 0.008)),
            height: Math.round(width * (i === 0 ? 0.012 : 0.008)),
            borderRadius: 9999,
            background: useLight ? accentColor : "rgba(255,255,255,0.4)",
            opacity: 0.35 - i * 0.08,
          }}
        />
      ))}

      {/* ── TOP ACCENT STRIPE ── */}
      <div
        style={{
          display: "flex",
          height: topStripeH,
          background: accentColor,
          width: "100%",
          flexShrink: 0,
        }}
      />

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingLeft: pad,
          paddingRight: Math.round(pad * 1.5),
          paddingTop: Math.round(height * 0.07),
          paddingBottom: 0,
          justifyContent: "flex-start",
          zIndex: 1,
        }}
      >
        {/* Eyebrow label */}
        <div
          style={{
            display: "flex",
            fontSize: eyebrowSize,
            fontWeight: 700,
            letterSpacing: Math.round(width * 0.004),
            textTransform: "uppercase",
            color: eyebrowColor,
            marginBottom: Math.round(height * 0.025),
          }}
        >
          {isWarm ? "Our Story" : isMinimal ? "Brand" : isElegant ? "About" : "Our Story"}
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : isMinimal ? 600 : 700,
            color: headlineColor,
            lineHeight: 1.15,
            letterSpacing: isElegant ? -2 : isBold ? -1.5 : -0.5,
            marginBottom: Math.round(height * 0.04),
          }}
        >
          {headline}
        </div>

        {/* Elegant line/dot separator */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: Math.round(width * 0.016),
            marginBottom: Math.round(height * 0.04),
          }}
        >
          <div
            style={{
              display: "flex",
              width: line1W,
              height: isElegant ? 1 : 3,
              background: accentColor,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.012),
              height: Math.round(width * 0.012),
              borderRadius: 9999,
              background: accentColor,
            }}
          />
          <div
            style={{
              display: "flex",
              width: line2W,
              height: isElegant ? 1 : 3,
              background: useLight ? accentColor : "rgba(255,255,255,0.35)",
              borderRadius: 2,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Body text — editorial, readable */}
        {subtext && (
          <div
            style={{
              display: "flex",
              fontSize: bodySize,
              fontWeight: isElegant ? 300 : 400,
              color: bodyColor,
              lineHeight: isElegant ? 1.85 : 1.7,
              letterSpacing: isElegant ? 0.3 : 0,
              maxWidth: "82%",
            }}
          >
            {subtext}
          </div>
        )}
      </div>

      {/* ── FOOTER — brand identity block ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(height * (isElegant ? 0.08 : 0.065)),
          paddingTop: Math.round(height * 0.03),
          zIndex: 1,
        }}
      >
        {/* Brand block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: Math.round(height * 0.012),
          }}
        >
          {/* Thin divider above brand */}
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.12),
              height: 2,
              background: useLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)",
              borderRadius: 1,
            }}
          />
          {brandName && (
            <div
              style={{
                display: "flex",
                fontSize: brandNameSize,
                fontWeight: 800,
                color: brandColor,
                letterSpacing: Math.round(width * 0.001),
              }}
            >
              {brandName}
            </div>
          )}
          {brandTagline && (
            <div
              style={{
                display: "flex",
                fontSize: taglineSize,
                fontWeight: 400,
                color: mutedColor,
                letterSpacing: 0.5,
                fontStyle: isElegant ? "italic" : "normal",
              }}
            >
              {brandTagline}
            </div>
          )}
        </div>

        {/* Decorative stacked lines — right side flourish */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: Math.round(height * 0.01),
            alignItems: "flex-end",
          }}
        >
          {[
            { w: Math.round(width * 0.07), opacity: 1, color: accentColor },
            { w: Math.round(width * 0.05), opacity: 0.5, color: useLight ? accentColor : "rgba(255,255,255,0.5)" },
            { w: Math.round(width * 0.032), opacity: 0.3, color: useLight ? accentColor : "rgba(255,255,255,0.5)" },
          ].map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: line.w,
                height: isElegant ? 1 : 3,
                background: line.color,
                opacity: line.opacity,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
