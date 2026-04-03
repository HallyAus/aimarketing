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

  const quoteFontSize = Math.round(width * (isElegant ? 0.032 : isMinimal ? 0.028 : 0.034));
  const quoteMarkFontSize = Math.round(width * (isBold ? 0.28 : isElegant ? 0.22 : 0.24));
  const attributionFontSize = Math.round(width * 0.022);
  const headlineFontSize = Math.round(width * 0.024);
  const brandFontSize = Math.round(width * 0.019);

  const quoteMarkOpacity = isMinimal ? 0.08 : isElegant ? 0.12 : isWarm ? 0.18 : 0.15;
  const cardBg = isWarm
    ? "rgba(255,255,255,0.12)"
    : isMinimal
      ? "rgba(255,255,255,0.07)"
      : "rgba(255,255,255,0.1)";

  const cardBorderRadius = isPlayful ? Math.round(width * 0.04) : isElegant ? 2 : Math.round(width * 0.02);

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
      {/* Subtle background circle — warm/elegant feel */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(width * 0.25),
          right: -Math.round(width * 0.2),
          width: Math.round(width * 0.65),
          height: Math.round(width * 0.65),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(width * 0.2),
          left: -Math.round(width * 0.15),
          width: Math.round(width * 0.5),
          height: Math.round(width * 0.5),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />

      {/* Card container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "80%",
          background: cardBg,
          borderRadius: cardBorderRadius,
          paddingTop: Math.round(height * 0.065),
          paddingBottom: Math.round(height * 0.065),
          paddingLeft: Math.round(width * 0.065),
          paddingRight: Math.round(width * 0.065),
          border: isMinimal
            ? `1px solid rgba(255,255,255,0.18)`
            : isElegant
              ? `1px solid rgba(255,255,255,0.15)`
              : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Giant decorative quote mark — behind content */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -Math.round(height * 0.04),
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

        {/* Accent line at top of card */}
        {!isMinimal && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: "10%",
              width: "80%",
              height: Math.round(height * 0.004),
              background: accentColor,
              borderRadius: "0 0 4px 4px",
              opacity: isElegant ? 0.6 : 1,
            }}
          />
        )}

        {/* Optional headline / context above quote */}
        {headline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: Math.round(height * 0.025),
            }}
          >
            <span
              style={{
                color: accentColor,
                fontSize: headlineFontSize,
                fontWeight: isElegant ? 400 : 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Quote text */}
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
                lineHeight: isElegant ? 1.7 : 1.55,
                letterSpacing: isElegant ? "0.02em" : "0",
              }}
            >
              {quote}
            </span>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isMinimal ? 0.06 : isElegant ? 0.1 : 0.15)),
            height: 1,
            background: isMinimal ? "rgba(255,255,255,0.2)" : accentColor,
            opacity: isMinimal ? 1 : 0.6,
            marginTop: Math.round(height * 0.028),
            marginBottom: Math.round(height * 0.022),
          }}
        />

        {/* Attribution */}
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
                color: "rgba(255,255,255,0.7)",
                fontSize: attributionFontSize,
                fontWeight: isElegant ? 300 : 500,
                fontStyle: "normal",
                letterSpacing: isElegant ? "0.05em" : "0",
              }}
            >
              — {attribution}
            </span>
          </div>
        )}

        {/* Closing quote mark (right-aligned, subtle) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -Math.round(height * 0.03),
            right: Math.round(width * 0.04),
            opacity: quoteMarkOpacity * 0.6,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              color: isPlayful ? accentColor : "#ffffff",
              fontSize: Math.round(quoteMarkFontSize * 0.7),
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "serif",
            }}
          >
            &rdquo;
          </span>
        </div>
      </div>

      {/* Brand name */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.04),
            flexDirection: "row",
            alignItems: "center",
            gap: Math.round(width * 0.01),
          }}
        >
          {isPlayful && (
            <div
              style={{
                display: "flex",
                width: Math.round(width * 0.007),
                height: Math.round(width * 0.007),
                borderRadius: "50%",
                background: accentColor,
              }}
            />
          )}
          <span
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: brandFontSize,
              fontWeight: isElegant ? 300 : 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {brandName}
          </span>
          {isPlayful && (
            <div
              style={{
                display: "flex",
                width: Math.round(width * 0.007),
                height: Math.round(width * 0.007),
                borderRadius: "50%",
                background: accentColor,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
