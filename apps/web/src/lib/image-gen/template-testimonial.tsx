import type { TemplateProps } from "./types";

export default function TemplateTestimonial({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const { headline, quote, attribution, brandName, mood, palette, accentColor } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";

  const pad = Math.round(width * 0.08);

  // Quote text — large and readable
  const quoteFontSize = Math.round(width * (isElegant ? 0.042 : isMinimal ? 0.038 : 0.044));
  // Giant quote marks — very visible, create immediate visual identity
  const quoteMarkFontSize = Math.round(width * (isBold ? 0.36 : isElegant ? 0.28 : 0.32));
  const attributionFontSize = Math.round(width * 0.030);
  const headlineFontSize = Math.round(width * 0.032);
  // Brand name clearly readable
  const brandFontSize = Math.round(width * 0.028);

  // High opacity quote marks — they ARE the design
  const quoteMarkOpacity = isMinimal ? 0.18 : isElegant ? 0.22 : isWarm ? 0.28 : 0.25;

  const cardBg = isWarm
    ? "rgba(255,255,255,0.16)"
    : isMinimal
      ? "rgba(255,255,255,0.1)"
      : "rgba(255,255,255,0.13)";

  const cardBorderRadius = isPlayful ? Math.round(width * 0.045) : isElegant ? 4 : Math.round(width * 0.025);

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
      {/* Large background circle — top right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(width * 0.3),
          right: -Math.round(width * 0.25),
          width: Math.round(width * 0.75),
          height: Math.round(width * 0.75),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      />
      {/* Large background circle — bottom left */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(width * 0.25),
          left: -Math.round(width * 0.2),
          width: Math.round(width * 0.6),
          height: Math.round(width * 0.6),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />

      {/* Card container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: width - pad * 2,
          background: cardBg,
          borderRadius: cardBorderRadius,
          paddingTop: Math.round(height * 0.07),
          paddingBottom: Math.round(height * 0.07),
          paddingLeft: Math.round(width * 0.07),
          paddingRight: Math.round(width * 0.07),
          border: isMinimal
            ? `2px solid rgba(255,255,255,0.25)`
            : isElegant
              ? `1px solid rgba(255,255,255,0.2)`
              : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* GIANT opening quote mark — bold design element, very visible */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -Math.round(height * 0.055),
            left: Math.round(width * 0.04),
            lineHeight: 1,
            pointerEvents: "none",
            opacity: quoteMarkOpacity,
          }}
        >
          <span
            style={{
              color: isPlayful ? accentColor : "#ffffff",
              fontSize: quoteMarkFontSize,
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "serif",
            }}
          >
            &ldquo;
          </span>
        </div>

        {/* Thick accent bar at top of card — colored, punchy */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: "8%",
            width: "84%",
            height: Math.round(height * 0.007),
            background: accentColor,
            borderRadius: "0 0 6px 6px",
          }}
        />

        {/* Optional headline — accent color, uppercase label */}
        {headline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: Math.round(height * 0.028),
            }}
          >
            <span
              style={{
                color: accentColor,
                fontSize: headlineFontSize,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Quote text — large, readable, italic */}
        {quote && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: quoteFontSize,
                fontWeight: isElegant ? 300 : isBold ? 600 : 400,
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: isElegant ? 1.65 : 1.55,
                letterSpacing: isElegant ? "0.02em" : "0",
              }}
            >
              {quote}
            </span>
          </div>
        )}

        {/* Accent divider — colored, wider */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isMinimal ? 0.1 : isElegant ? 0.16 : 0.22)),
            height: isElegant ? 2 : 3,
            background: accentColor,
            borderRadius: 999,
            marginTop: Math.round(height * 0.032),
            marginBottom: Math.round(height * 0.026),
          }}
        />

        {/* Attribution — clearly visible, right-aligned */}
        {attribution && (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: attributionFontSize,
                fontWeight: isElegant ? 400 : 600,
                fontStyle: "normal",
                letterSpacing: isElegant ? "0.05em" : "0.02em",
              }}
            >
              — {attribution}
            </span>
          </div>
        )}

        {/* Closing quote mark — visible, right side */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -Math.round(height * 0.04),
            right: Math.round(width * 0.04),
            opacity: quoteMarkOpacity * 0.65,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              color: isPlayful ? accentColor : "#ffffff",
              fontSize: Math.round(quoteMarkFontSize * 0.72),
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "serif",
            }}
          >
            &rdquo;
          </span>
        </div>
      </div>

      {/* Brand name — prominent pill at bottom */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.042),
            flexDirection: "row",
            alignItems: "center",
            gap: Math.round(width * 0.012),
            background: "rgba(0,0,0,0.25)",
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
              color: "rgba(255,255,255,0.92)",
              fontSize: brandFontSize,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {brandName}
          </span>
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.01),
              height: Math.round(width * 0.01),
              borderRadius: "50%",
              background: accentColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
