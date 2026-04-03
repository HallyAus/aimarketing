import type { TemplateProps } from "./types";

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

  const borderRadius = isPlayful ? 20 : isElegant ? 2 : 12;
  const vsBorderRadius = isPlayful ? 9999 : isElegant ? 4 : 9999;
  const headlineFontSize = isBold ? 36 : isMinimal ? 26 : 30;
  const labelFontSize = isBold ? 13 : 11;
  const contentFontSize = isBold ? 22 : isMinimal ? 18 : 20;
  const headerHeight = 100;
  const footerHeight = 56;
  const splitHeight = height - headerHeight - footerHeight;
  const vsSize = isBold ? 52 : 42;

  // Derive panel colors: before uses a muted/darkened version, after uses vibrant
  const beforeBg = isMinimal ? "#e8e8e8" : palette[0];
  const afterBg = isMinimal ? palette[0] : palette[1];
  const beforeTextColor = isMinimal ? "#333333" : "#ffffff";
  const afterTextColor = "#ffffff";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        background: isMinimal
          ? "#f5f5f5"
          : `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        fontFamily: "Inter, sans-serif",
        borderRadius,
        overflow: "hidden",
      }}
    >
      {/* Headline bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: headerHeight,
          paddingLeft: 40,
          paddingRight: 40,
          background: isMinimal ? "#ffffff" : "rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: headlineFontSize,
            fontWeight: isBold ? 900 : isElegant ? 300 : 700,
            color: isMinimal ? "#1a1a1a" : "#ffffff",
            letterSpacing: isElegant ? -1 : 0,
            textAlign: "center",
          }}
        >
          {headline}
        </div>
      </div>

      {/* Split panels row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          height: splitHeight,
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
            paddingLeft: 32,
            paddingRight: 20,
            paddingTop: 24,
            paddingBottom: 24,
            gap: 12,
          }}
        >
          {/* Label */}
          <div
            style={{
              display: "flex",
              fontSize: labelFontSize,
              fontWeight: 700,
              letterSpacing: 4,
              color: isMinimal ? accentColor : "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            BEFORE
          </div>
          {/* Divider under label */}
          <div
            style={{
              display: "flex",
              width: 32,
              height: 2,
              background: isMinimal ? accentColor : "rgba(255,255,255,0.3)",
              borderRadius: 1,
            }}
          />
          {/* Content */}
          <div
            style={{
              display: "flex",
              fontSize: contentFontSize,
              fontWeight: isBold ? 700 : 400,
              color: beforeTextColor,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {beforeText ?? "Before state"}
          </div>
        </div>

        {/* VS badge — centered divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: vsSize + 8,
            flexShrink: 0,
            background: isMinimal ? "#ffffff" : "rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: vsSize,
              height: vsSize,
              borderRadius: vsBorderRadius,
              background: accentColor,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: isBold ? 14 : 12,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: 1,
              }}
            >
              VS
            </div>
          </div>
        </div>

        {/* AFTER panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            background: afterBg,
            paddingLeft: 20,
            paddingRight: 32,
            paddingTop: 24,
            paddingBottom: 24,
            gap: 12,
          }}
        >
          {/* Label */}
          <div
            style={{
              display: "flex",
              fontSize: labelFontSize,
              fontWeight: 700,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            AFTER
          </div>
          {/* Divider under label */}
          <div
            style={{
              display: "flex",
              width: 32,
              height: 2,
              background: "rgba(255,255,255,0.45)",
              borderRadius: 1,
            }}
          />
          {/* Content */}
          <div
            style={{
              display: "flex",
              fontSize: contentFontSize,
              fontWeight: isBold ? 700 : 400,
              color: afterTextColor,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {afterText ?? "After state"}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: footerHeight,
          paddingLeft: 32,
          paddingRight: 32,
          background: isMinimal ? "#ffffff" : "rgba(0,0,0,0.2)",
        }}
      >
        {brandName && (
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              color: isMinimal ? "#888888" : "rgba(255,255,255,0.6)",
            }}
          >
            {brandName}
          </div>
        )}
        {/* Accent stripe */}
        <div
          style={{
            display: "flex",
            height: 4,
            width: 48,
            borderRadius: 2,
            background: accentColor,
          }}
        />
      </div>
    </div>
  );
}
