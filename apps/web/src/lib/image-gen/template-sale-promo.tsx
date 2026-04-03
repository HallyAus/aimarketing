import type { TemplateProps } from "./types";

export default function TemplateSalePromo({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const { headline, subtext, cta, brandName, metric, metricLabel, mood, palette, accentColor } =
    spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";

  const pad = Math.round(width * 0.08);

  // Metric DOMINATES — this is the entire point of the image
  const metricFontSize = Math.round(width * (isBold ? 0.18 : isElegant ? 0.14 : 0.16));
  const metricLabelFontSize = Math.round(width * (isBold ? 0.042 : 0.036));
  const headlineFontSize = Math.round(width * 0.038);
  const subtextFontSize = Math.round(width * 0.030);
  const brandFontSize = Math.round(width * 0.026);
  const ctaFontSize = Math.round(width * 0.032);
  const ctaPadV = Math.round(height * 0.028);
  const ctaPadH = Math.round(width * 0.065);

  // Diagonal stripes — more visible, bolder
  const stripeCount = isBold ? 10 : isMinimal ? 5 : 7;
  const stripeWidth = Math.round(width * (isBold ? 0.06 : 0.04));
  const stripeOpacity = isMinimal ? 0.07 : isElegant ? 0.09 : isWarm ? 0.14 : 0.16;

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
      {/* Diagonal stripes overlay — bolder and more visible */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          flexDirection: "row",
          overflow: "hidden",
          opacity: stripeOpacity,
          transform: "rotate(-30deg) scaleX(2.5) translateX(-20%) translateY(-30%)",
        }}
      >
        {Array.from({ length: stripeCount }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              width: stripeWidth,
              height: height * 2.5,
              background: i % 2 === 0 ? "#ffffff" : "transparent",
              marginRight: stripeWidth * 1.1,
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Thick top accent bar — urgency stripe */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: Math.round(height * 0.018),
          background: accentColor,
        }}
      />

      {/* Thick bottom accent bar */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          width,
          height: Math.round(height * 0.018),
          background: accentColor,
        }}
      />

      {/* Corner accent shape — top right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(width * 0.15),
          right: -Math.round(width * 0.15),
          width: Math.round(width * 0.45),
          height: Math.round(width * 0.45),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }}
      />

      {/* Corner accent shape — bottom left */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(width * 0.12),
          left: -Math.round(width * 0.12),
          width: Math.round(width * 0.38),
          height: Math.round(width * 0.38),
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: width - pad * 2,
          gap: Math.round(height * 0.02),
          zIndex: 1,
        }}
      >
        {/* Urgency badge — always visible */}
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.28)",
            borderRadius: isPlayful ? 999 : 6,
            paddingTop: Math.round(height * 0.011),
            paddingBottom: Math.round(height * 0.011),
            paddingLeft: Math.round(width * 0.036),
            paddingRight: Math.round(width * 0.036),
            border: `2px solid ${accentColor}`,
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: Math.round(width * 0.022),
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {isPlayful ? "🔥 " : ""}LIMITED TIME OFFER
          </span>
        </div>

        {/* HUGE METRIC — dominates the visual */}
        {metric && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 0.85,
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: metricFontSize,
                fontWeight: isBold ? 900 : isElegant ? 200 : 900,
                letterSpacing: isBold ? "-0.04em" : isElegant ? "0.02em" : "-0.03em",
                textShadow: isBold
                  ? "0 6px 40px rgba(0,0,0,0.35)"
                  : isPlayful
                    ? `0 0 60px ${accentColor}bb`
                    : "0 4px 24px rgba(0,0,0,0.25)",
              }}
            >
              {metric}
            </span>
          </div>
        )}

        {/* Metric label pill — accent color, prominent */}
        {metricLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: accentColor,
              borderRadius: isPlayful ? 999 : 4,
              paddingTop: Math.round(height * 0.014),
              paddingBottom: Math.round(height * 0.014),
              paddingLeft: Math.round(width * 0.05),
              paddingRight: Math.round(width * 0.05),
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: metricLabelFontSize,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {metricLabel}
            </span>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isMinimal ? 0.1 : 0.22)),
            height: isElegant ? 1 : 3,
            background: "rgba(255,255,255,0.5)",
            borderRadius: 999,
          }}
        />

        {/* Headline — supporting text, still readable */}
        {headline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: headlineFontSize,
                fontWeight: isElegant ? 300 : 700,
                textAlign: "center",
                letterSpacing: isElegant ? "0.05em" : "0",
                lineHeight: 1.3,
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Subtext — concise, trim to 1 line visually */}
        {subtext && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: subtextFontSize,
                fontWeight: 400,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              {subtext}
            </span>
          </div>
        )}

        {/* CTA — white pill, high contrast against gradient */}
        {cta && (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(height * 0.012),
            }}
          >
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                borderRadius: 999,
                paddingTop: ctaPadV,
                paddingBottom: ctaPadV,
                paddingLeft: ctaPadH,
                paddingRight: ctaPadH,
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
              }}
            >
              <span
                style={{
                  color: palette[0],
                  fontSize: ctaFontSize,
                  fontWeight: 800,
                  letterSpacing: "0.01em",
                }}
              >
                {cta}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Brand name — pill at bottom, clearly visible */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.048),
            right: Math.round(width * 0.06),
            background: "rgba(0,0,0,0.25)",
            borderRadius: 999,
            paddingTop: Math.round(height * 0.008),
            paddingBottom: Math.round(height * 0.008),
            paddingLeft: Math.round(width * 0.022),
            paddingRight: Math.round(width * 0.022),
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: brandFontSize,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {brandName}
          </span>
        </div>
      )}
    </div>
  );
}
