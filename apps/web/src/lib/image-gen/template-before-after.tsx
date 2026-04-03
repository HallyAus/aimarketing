import type { TemplateProps } from "./types";

/**
 * Before/After template — landscape (1200x630 Facebook default).
 * Layout: headline bar at top, then a clean horizontal split:
 *   LEFT = BEFORE (darker/muted palette shade)
 *   RIGHT = AFTER  (vibrant palette + accent highlights)
 * A bold vertical accent-color divider separates the halves.
 */
export default function TemplateBeforeAfter({
  spec,
  width,
  height,
}: TemplateProps): React.ReactElement {
  const {
    headline,
    beforeText,
    afterText,
    palette,
    accentColor,
    brandName,
    mood,
  } = spec;

  const isBold = mood === "bold";
  const isElegant = mood === "elegant";
  const isPlayful = mood === "playful";
  const isMinimal = mood === "minimal";

  // --- Sizing ---
  const pad = Math.round(width * 0.05);
  const headerH = Math.round(height * 0.22);
  const footerH = Math.round(height * 0.12);
  const splitH = height - headerH - footerH;
  const dividerW = Math.round(width * 0.006);

  const headlineSize = Math.round(width * (isBold ? 0.052 : isMinimal ? 0.038 : 0.044));
  const labelSize = Math.round(width * 0.04);
  const contentSize = Math.round(width * (isBold ? 0.038 : isMinimal ? 0.03 : 0.034));
  const brandSize = Math.round(width * 0.022);
  const borderRadius = isPlayful ? Math.round(width * 0.02) : isElegant ? 4 : Math.round(width * 0.012);

  // --- Colors ---
  // Before: muted dark version; After: vibrant with accent-tinged overlay
  const beforeBg = isMinimal
    ? "#e0e0e0"
    : `linear-gradient(160deg, ${palette[0]}ee, ${palette[0]}99)`;
  const afterBg = isMinimal
    ? palette[0]
    : `linear-gradient(160deg, ${palette[1]}cc, ${palette[1]}ff)`;
  const headerBg = isMinimal ? "#ffffff" : `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
  const footerBg = isMinimal ? "#ffffff" : "rgba(0,0,0,0.28)";
  const beforeTextColor = isMinimal ? "#333333" : "#ffffff";
  const afterTextColor = "#ffffff";
  const headerTextColor = isMinimal ? "#111111" : "#ffffff";

  // Decorative stripe opacity
  const stripeOpacity = isMinimal ? 0.06 : 0.15;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        fontFamily: "Inter, sans-serif",
        borderRadius,
        overflow: "hidden",
      }}
    >
      {/* ── HEADLINE BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: headerH,
          background: headerBg,
          paddingLeft: pad,
          paddingRight: pad,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Decorative diagonal stripes behind headline */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: isMinimal
              ? "none"
              : `repeating-linear-gradient(
                  -55deg,
                  transparent,
                  transparent 28px,
                  rgba(255,255,255,${stripeOpacity}) 28px,
                  rgba(255,255,255,${stripeOpacity}) 30px
                )`,
          }}
        />
        {/* Accent bottom border on header */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: isBold ? 5 : 3,
            background: accentColor,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 800,
            color: headerTextColor,
            lineHeight: 1.15,
            letterSpacing: isElegant ? -1.5 : isBold ? -1 : -0.5,
            textAlign: "center",
            zIndex: 1,
          }}
        >
          {headline}
        </div>
      </div>

      {/* ── SPLIT PANELS ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: splitH,
          flexShrink: 0,
        }}
      >
        {/* BEFORE panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            background: beforeBg,
            paddingLeft: Math.round(pad * 0.9),
            paddingRight: Math.round(pad * 0.5),
            paddingTop: Math.round(pad * 0.5),
            paddingBottom: Math.round(pad * 0.5),
            gap: Math.round(height * 0.025),
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle decorative circle */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: -Math.round(splitH * 0.2),
              right: -Math.round(splitH * 0.1),
              width: Math.round(splitH * 0.7),
              height: Math.round(splitH * 0.7),
              borderRadius: 9999,
              border: `${Math.round(width * 0.004)}px solid rgba(255,255,255,0.12)`,
            }}
          />

          {/* BEFORE label pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: Math.round(width * 0.02),
              paddingRight: Math.round(width * 0.02),
              paddingTop: Math.round(height * 0.014),
              paddingBottom: Math.round(height * 0.014),
              background: isMinimal ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.3)",
              borderRadius: isElegant ? 4 : 9999,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: labelSize,
                fontWeight: 900,
                letterSpacing: Math.round(width * 0.004),
                color: beforeTextColor,
                textTransform: "uppercase",
              }}
            >
              BEFORE
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              display: "flex",
              fontSize: contentSize,
              fontWeight: isBold ? 700 : 500,
              color: beforeTextColor,
              lineHeight: 1.45,
              textAlign: "center",
              opacity: 0.92,
            }}
          >
            {beforeText ?? "The old way"}
          </div>
        </div>

        {/* Vertical divider */}
        <div
          style={{
            display: "flex",
            width: dividerW,
            background: accentColor,
            flexShrink: 0,
          }}
        />

        {/* AFTER panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            background: afterBg,
            paddingLeft: Math.round(pad * 0.5),
            paddingRight: Math.round(pad * 0.9),
            paddingTop: Math.round(pad * 0.5),
            paddingBottom: Math.round(pad * 0.5),
            gap: Math.round(height * 0.025),
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow circle top-right */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: -Math.round(splitH * 0.15),
              right: -Math.round(splitH * 0.15),
              width: Math.round(splitH * 0.6),
              height: Math.round(splitH * 0.6),
              borderRadius: 9999,
              background: "rgba(255,255,255,0.08)",
            }}
          />

          {/* AFTER label pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: Math.round(width * 0.02),
              paddingRight: Math.round(width * 0.02),
              paddingTop: Math.round(height * 0.014),
              paddingBottom: Math.round(height * 0.014),
              background: accentColor,
              borderRadius: isElegant ? 4 : 9999,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: labelSize,
                fontWeight: 900,
                letterSpacing: Math.round(width * 0.004),
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              AFTER
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              display: "flex",
              fontSize: contentSize,
              fontWeight: isBold ? 700 : 600,
              color: afterTextColor,
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            {afterText ?? "The new way"}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          height: footerH,
          paddingLeft: pad,
          paddingRight: pad,
          background: footerBg,
          flexShrink: 0,
        }}
      >
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: brandSize,
              fontWeight: 700,
              color: isMinimal ? "#222222" : "#ffffff",
              letterSpacing: Math.round(width * 0.001),
            }}
          >
            {brandName}
          </div>
        )}
        {/* Accent stripe */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: Math.round(width * 0.006),
            alignItems: "center",
          }}
        >
          {[1, 0, 0, 0].map((active, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: active ? Math.round(width * 0.05) : Math.round(width * 0.012),
                height: Math.round(width * 0.012),
                borderRadius: 9999,
                background: active ? accentColor : isMinimal ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
