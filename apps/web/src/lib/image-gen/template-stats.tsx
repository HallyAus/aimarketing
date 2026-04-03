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

  const pad = Math.round(width * 0.08);

  // Metric even bigger — the entire reason this image exists
  const metricFontSize = Math.round(width * (isBold ? 0.145 : isElegant ? 0.11 : 0.13));
  const metricLabelFontSize = Math.round(width * 0.036);
  const headlineFontSize = Math.round(width * (isMinimal ? 0.034 : 0.04));
  const subtextFontSize = Math.round(width * 0.030);
  // Brand name more prominent
  const brandFontSize = Math.round(width * 0.028);

  // Dot grid — bigger dots, higher opacity
  const dotSize = Math.round(width * (isMinimal ? 0.009 : isPlayful ? 0.014 : 0.011));
  const dotOpacity = isMinimal ? 0.18 : isElegant ? 0.16 : isWarm ? 0.25 : 0.22;
  const dotsPerRow = isMinimal ? 6 : 7;
  const dotRows = isMinimal ? 5 : 6;
  const dotGap = Math.round(width * 0.034);

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
      {/* Dot grid — top left, more visible */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: Math.round(height * 0.05),
          left: Math.round(width * 0.05),
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

      {/* Dot grid — bottom right, accent colored */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: Math.round(height * 0.1),
          right: Math.round(width * 0.05),
          flexDirection: "column",
          gap: dotGap,
          opacity: dotOpacity * 0.75,
        }}
      >
        {Array.from({ length: Math.max(dotRows - 2, 3) }).map((_, row) => (
          <div
            key={row}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: dotGap,
            }}
          >
            {Array.from({ length: Math.max(dotsPerRow - 2, 4) }).map((_, col) => (
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

      {/* Large decorative ring — more visible border */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -Math.round(width * 0.22),
          left: -Math.round(width * 0.22),
          width: Math.round(width * 0.65),
          height: Math.round(width * 0.65),
          borderRadius: "50%",
          border: `${Math.round(width * 0.02)}px solid rgba(255,255,255,${isMinimal ? 0.1 : 0.16})`,
        }}
      />

      {/* Second ring — top right */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -Math.round(width * 0.18),
          right: -Math.round(width * 0.18),
          width: Math.round(width * 0.5),
          height: Math.round(width * 0.5),
          borderRadius: "50%",
          border: `${Math.round(width * 0.015)}px solid rgba(255,255,255,${isMinimal ? 0.07 : 0.12})`,
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
          gap: Math.round(height * 0.018),
          zIndex: 1,
        }}
      >
        {/* Thick accent bar above metric */}
        <div
          style={{
            display: "flex",
            width: Math.round(width * (isPlayful ? 0.14 : isMinimal ? 0.08 : 0.12)),
            height: Math.round(height * (isElegant ? 0.004 : 0.008)),
            background: accentColor,
            borderRadius: 999,
          }}
        />

        {/* HUGE metric number */}
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
                fontWeight: isBold ? 900 : isElegant ? 200 : isMinimal ? 300 : 900,
                letterSpacing: isBold ? "-0.04em" : isElegant ? "0.06em" : "-0.03em",
                lineHeight: 1,
                textShadow: isBold
                  ? "0 6px 48px rgba(0,0,0,0.3)"
                  : isPlayful
                    ? `0 0 80px ${accentColor}99`
                    : "0 4px 32px rgba(0,0,0,0.2)",
              }}
            >
              {metric}
            </span>
          </div>
        )}

        {/* Metric label — accent color, big and clear */}
        {metricLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isMinimal ? "rgba(255,255,255,0.15)" : accentColor,
              borderRadius: isPlayful ? 999 : 6,
              paddingTop: Math.round(height * 0.012),
              paddingBottom: Math.round(height * 0.012),
              paddingLeft: Math.round(width * 0.045),
              paddingRight: Math.round(width * 0.045),
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: metricLabelFontSize,
                fontWeight: isElegant ? 500 : 800,
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
            width: Math.round(width * (isMinimal ? 0.08 : 0.18)),
            height: 2,
            background: "rgba(255,255,255,0.4)",
            borderRadius: 999,
            marginTop: Math.round(height * 0.008),
            marginBottom: Math.round(height * 0.008),
          }}
        />

        {/* Headline — lighter color, well-sized */}
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
                fontWeight: isElegant ? 300 : isBold ? 700 : 600,
                textAlign: "center",
                lineHeight: 1.35,
                letterSpacing: isElegant ? "0.04em" : "0",
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Subtext — clearly readable, lighter but bigger */}
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
                color: "rgba(255,255,255,0.7)",
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

      {/* Brand footer — prominent pill treatment */}
      {brandName && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: Math.round(height * 0.044),
            flexDirection: "row",
            alignItems: "center",
            gap: Math.round(width * 0.014),
            background: "rgba(0,0,0,0.25)",
            borderRadius: 999,
            paddingTop: Math.round(height * 0.009),
            paddingBottom: Math.round(height * 0.009),
            paddingLeft: Math.round(width * 0.03),
            paddingRight: Math.round(width * 0.03),
          }}
        >
          <div
            style={{
              display: "flex",
              width: Math.round(width * 0.011),
              height: Math.round(width * 0.011),
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
              width: Math.round(width * 0.011),
              height: Math.round(width * 0.011),
              borderRadius: "50%",
              background: accentColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
