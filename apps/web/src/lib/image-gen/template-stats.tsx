import type { TemplateProps } from "./types";

export default function TemplateStats({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const { headline, subtext, brandName, metric, metricLabel, mood, palette, accentColor } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";

  const metricFontSize = Math.round(width * (isBold ? 0.115 : isElegant ? 0.085 : 0.1));
  const metricLabelFontSize = Math.round(width * 0.026);
  const headlineFontSize = Math.round(width * (isMinimal ? 0.024 : 0.03));
  const subtextFontSize = Math.round(width * 0.021);
  const brandFontSize = Math.round(width * 0.019);

  // Dot grid decoration parameters
  const dotSize = Math.round(width * (isMinimal ? 0.006 : isPlayful ? 0.01 : 0.008));
  const dotOpacity = isMinimal ? 0.12 : isElegant ? 0.1 : isWarm ? 0.18 : 0.15;
  const dotsPerRow = isMinimal ? 5 : 6;
  const dotRows = isMinimal ? 4 : 5;
  const dotGap = Math.round(width * 0.032);

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
      {/* Dot grid — top left */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: Math.round(height * 0.06),
          left: Math.round(width * 0.06),
          flexDirection: "column",
          gap: dotGap,
          opacity: dotOpacity,
        }}
      >
        {Array.from({ length: dotRows }).map((_, row) => (
          <div
            key={row}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: dotGap,
            }}
          >
            {Array.from({ length: dotsPerRow }).map((_, col) => (
              <div
                key={col}
                style={{
                  display: "flex",
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  background: "#ffffff",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Dot grid — bottom right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: Math.round(height * 0.08),
          right: Math.round(width * 0.06),
          flexDirection: "column",
          gap: dotGap,
          opacity: dotOpacity * 0.7,
        }}
      >
        {Array.from({ length: Math.max(dotRows - 2, 2) }).map((_, row) => (
          <div
            key={row}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: dotGap,
            }}
          >
            {Array.from({ length: Math.max(dotsPerRow - 2, 3) }).map((_, col) => (
              <div
                key={col}
                style={{
                  display: "flex",
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  background: accentColor,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Large decorative ring */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(width * 0.18),
          left: -Math.round(width * 0.18),
          width: Math.round(width * 0.5),
          height: Math.round(width * 0.5),
          borderRadius: "50%",
          border: `${Math.round(width * 0.015)}px solid rgba(255,255,255,${isMinimal ? 0.06 : 0.1})`,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "80%",
          gap: Math.round(height * 0.016),
          zIndex: 1,
        }}
      >
        {/* Accent line above metric */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isPlayful ? 0.1 : isMinimal ? 0.06 : 0.08)),
            height: Math.round(height * (isElegant ? 0.003 : 0.005)),
            background: accentColor,
            borderRadius: 999,
          }}
        />

        {/* Metric number */}
        {metric && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: metricFontSize,
                fontWeight: isBold ? 900 : isElegant ? 200 : isMinimal ? 300 : 800,
                letterSpacing: isBold ? "-0.04em" : isElegant ? "0.06em" : "-0.02em",
                lineHeight: 1,
                textShadow: isBold
                  ? "0 4px 40px rgba(0,0,0,0.25)"
                  : isPlayful
                    ? `0 0 60px ${accentColor}88`
                    : "none",
              }}
            >
              {metric}
            </span>
          </div>
        )}

        {/* Metric label */}
        {metricLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: isMinimal ? "rgba(255,255,255,0.6)" : accentColor,
                fontSize: metricLabelFontSize,
                fontWeight: isElegant ? 400 : 700,
                letterSpacing: "0.14em",
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
            width: Math.round(width * (isMinimal ? 0.06 : 0.14)),
            height: 1,
            background: "rgba(255,255,255,0.3)",
            marginTop: Math.round(height * 0.008),
            marginBottom: Math.round(height * 0.008),
          }}
        />

        {/* Headline */}
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
                color: "rgba(255,255,255,0.88)",
                fontSize: headlineFontSize,
                fontWeight: isElegant ? 300 : isBold ? 700 : 500,
                textAlign: "center",
                lineHeight: 1.4,
                letterSpacing: isElegant ? "0.04em" : "0",
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Subtext */}
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
                color: "rgba(255,255,255,0.55)",
                fontSize: subtextFontSize,
                fontWeight: 400,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {subtext}
            </span>
          </div>
        )}
      </div>

      {/* Brand footer */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.04),
            flexDirection: "row",
            alignItems: "center",
            gap: Math.round(width * 0.012),
          }}
        >
          {/* Small accent dot */}
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.008),
              height: Math.round(width * 0.008),
              borderRadius: "50%",
              background: accentColor,
              opacity: 0.7,
            }}
          />
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
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.008),
              height: Math.round(width * 0.008),
              borderRadius: "50%",
              background: accentColor,
              opacity: 0.7,
            }}
          />
        </div>
      )}
    </div>
  );
}
