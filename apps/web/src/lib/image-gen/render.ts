import type { CardSpec } from "./types";

/* ── Platform size presets ────────────────────────────────────── */

export const SIZE_PRESETS: Record<string, { width: number; height: number }> = {
  "instagram-square": { width: 1080, height: 1080 },
  "instagram-story": { width: 1080, height: 1920 },
  "facebook-post": { width: 1200, height: 630 },
  "twitter-post": { width: 1600, height: 900 },
  "linkedin-post": { width: 1200, height: 627 },
  "tiktok-cover": { width: 1080, height: 1920 },
  "youtube-thumbnail": { width: 1280, height: 720 },
};

/* ── Browser instance (reused across invocations) ─────────────── */

let browserPromise: Promise<any> | null = null;

async function getBrowser() {
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    if (process.env.NODE_ENV === "development") {
      // Local dev: use system Chrome
      const puppeteer = await import("puppeteer-core");
      return puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox"],
        executablePath:
          process.platform === "win32"
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "darwin"
              ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
              : "/usr/bin/google-chrome",
      });
    }

    // Vercel serverless: use @sparticuz/chromium
    const chromium = await import("@sparticuz/chromium");
    const puppeteer = await import("puppeteer-core");
    return puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: null,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  })();

  return browserPromise;
}

/* ── Generate HTML for a card spec ────────────────────────────── */

export function generateCardHtml(
  spec: CardSpec,
  width: number,
  height: number,
): string {
  const { headline, subtext, cta, metric, metricLabel, steps, quote, attribution,
    beforeText, afterText, eventDate, palette, accentColor, mood, brandName, brandTagline } = spec;

  // Mood-based settings
  const isPlayful = mood === "playful";
  const isElegant = mood === "elegant";
  const isMinimal = mood === "minimal";
  const isWarm = mood === "warm";
  const headlineWeight = isElegant ? 300 : 800;
  const borderRadius = isPlayful ? "20px" : "0";

  // Font sizes relative to width
  const h1Size = Math.round(width * 0.065);
  const h2Size = Math.round(width * 0.035);
  const bodySize = Math.round(width * 0.028);
  const smallSize = Math.round(width * 0.022);
  const metricSize = Math.round(width * 0.14);
  const pad = Math.round(width * 0.07);

  const template = spec.template;

  // Build template-specific content
  let contentHtml = "";

  switch (template) {
    case "announcement":
      contentHtml = `
        <div class="badge">${brandName ? brandName.toUpperCase() : "NEW"}</div>
        <h1>${escapeHtml(headline)}</h1>
        ${subtext ? `<p class="subtext">${escapeHtml(subtext)}</p>` : ""}
        ${cta ? `<div class="cta-bar"><span class="cta-text">${escapeHtml(cta)}</span><span class="arrow">→</span></div>` : ""}
      `;
      break;

    case "sale-promo":
      contentHtml = `
        ${brandName ? `<div class="badge">${brandName.toUpperCase()}</div>` : ""}
        <div class="metric">${escapeHtml(metric || "SALE")}</div>
        ${metricLabel ? `<div class="metric-label">${escapeHtml(metricLabel)}</div>` : ""}
        <h1>${escapeHtml(headline)}</h1>
        ${cta ? `<div class="cta-bar"><span class="cta-text">${escapeHtml(cta)}</span><span class="arrow">→</span></div>` : ""}
      `;
      break;

    case "stats":
      contentHtml = `
        <div class="metric">${escapeHtml(metric || "0")}</div>
        ${metricLabel ? `<div class="metric-label">${escapeHtml(metricLabel)}</div>` : ""}
        <h1>${escapeHtml(headline)}</h1>
        ${subtext ? `<p class="subtext">${escapeHtml(subtext)}</p>` : ""}
        ${brandName ? `<div class="brand-pill">${escapeHtml(brandName)}</div>` : ""}
      `;
      break;

    case "testimonial":
      contentHtml = `
        <div class="quote-mark">"</div>
        <div class="quote-text">${escapeHtml(quote || headline)}</div>
        ${attribution ? `<div class="attribution">— ${escapeHtml(attribution)}</div>` : ""}
        ${brandName ? `<div class="brand-pill">${escapeHtml(brandName)}</div>` : ""}
      `;
      break;

    case "tips-howto":
      contentHtml = `
        <h1>${escapeHtml(headline)}</h1>
        <div class="steps">
          ${(steps || []).slice(0, 5).map((s, i) => `
            <div class="step">
              <div class="step-num">${i + 1}</div>
              <div class="step-text">${escapeHtml(s)}</div>
            </div>
          `).join("")}
        </div>
        ${brandName ? `<div class="brand-pill">${escapeHtml(brandName)}</div>` : ""}
      `;
      break;

    case "before-after":
      contentHtml = `
        <h1>${escapeHtml(headline)}</h1>
        <div class="split">
          <div class="split-half before">
            <div class="split-label">BEFORE</div>
            <div class="split-text">${escapeHtml(beforeText || "")}</div>
          </div>
          <div class="split-divider">VS</div>
          <div class="split-half after">
            <div class="split-label">AFTER</div>
            <div class="split-text">${escapeHtml(afterText || "")}</div>
          </div>
        </div>
        ${brandName ? `<div class="brand-pill">${escapeHtml(brandName)}</div>` : ""}
      `;
      break;

    case "event-launch":
      contentHtml = `
        ${eventDate ? `<div class="date-badge">${escapeHtml(eventDate)}</div>` : ""}
        <h1>${escapeHtml(headline)}</h1>
        ${subtext ? `<p class="subtext">${escapeHtml(subtext)}</p>` : ""}
        ${cta ? `<div class="cta-bar"><span class="cta-text">${escapeHtml(cta)}</span><span class="arrow">→</span></div>` : ""}
        ${brandName ? `<div class="brand-pill">${escapeHtml(brandName)}</div>` : ""}
      `;
      break;

    case "brand-story":
      contentHtml = `
        ${brandName ? `<div class="badge">${brandName.toUpperCase()}</div>` : ""}
        <h1>${escapeHtml(headline)}</h1>
        <div class="divider-line"></div>
        ${subtext ? `<p class="body-text">${escapeHtml(subtext)}</p>` : ""}
        ${brandTagline ? `<p class="tagline">${escapeHtml(brandTagline)}</p>` : ""}
      `;
      break;

    case "carousel-card":
      contentHtml = `
        <div class="slide-num">${metric && /^\d/.test(metric) ? metric.padStart(2, "0") : "01"}</div>
        <h1>${escapeHtml(headline)}</h1>
        ${subtext ? `<p class="subtext">${escapeHtml(subtext)}</p>` : ""}
        ${cta ? `<div class="cta-bar"><span class="cta-text">${escapeHtml(cta)}</span><span class="arrow">→</span></div>` : ""}
        <div class="dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
      `;
      break;

    case "product-showcase":
    default:
      contentHtml = `
        ${brandName ? `<div class="badge">${brandName.toUpperCase()}</div>` : ""}
        <h1>${escapeHtml(headline)}</h1>
        ${subtext ? `<p class="subtext">${escapeHtml(subtext)}</p>` : ""}
        ${cta ? `<div class="cta-bar"><span class="cta-text">${escapeHtml(cta)}</span><span class="arrow">→</span></div>` : ""}
      `;
      break;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: 'Outfit', -apple-system, sans-serif;
    color: #F5F5F7;
    background: ${palette[0]};
  }

  .card {
    width: ${width}px;
    height: ${height}px;
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, ${palette[0]}, ${palette[1]});
    border-radius: ${borderRadius};
  }

  /* Grid background */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: ${Math.round(width * 0.04)}px ${Math.round(width * 0.04)}px;
    z-index: 1;
  }

  /* Glow orbs */
  .glow-1 {
    position: absolute;
    width: ${Math.round(width * 0.5)}px;
    height: ${Math.round(width * 0.5)}px;
    border-radius: 50%;
    background: ${accentColor};
    filter: blur(${Math.round(width * 0.1)}px);
    opacity: 0.3;
    top: -${Math.round(width * 0.1)}px;
    right: -${Math.round(width * 0.08)}px;
    z-index: 1;
  }

  .glow-2 {
    position: absolute;
    width: ${Math.round(width * 0.4)}px;
    height: ${Math.round(width * 0.4)}px;
    border-radius: 50%;
    background: ${palette[1]};
    filter: blur(${Math.round(width * 0.08)}px);
    opacity: 0.25;
    bottom: -${Math.round(width * 0.1)}px;
    left: -${Math.round(width * 0.06)}px;
    z-index: 1;
  }

  /* Content container */
  .content {
    position: relative;
    z-index: 2;
    padding: ${pad}px;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
  }

  /* Badge */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    padding: ${Math.round(height * 0.01)}px ${Math.round(width * 0.02)}px;
    border-radius: 20px;
    font-family: 'Space Mono', monospace;
    font-size: ${smallSize}px;
    letter-spacing: 2px;
    color: ${accentColor};
    width: fit-content;
    margin-bottom: ${Math.round(height * 0.03)}px;
  }

  /* Headline */
  h1 {
    font-size: ${h1Size}px;
    font-weight: ${headlineWeight};
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: ${Math.round(height * 0.025)}px;
    ${isElegant ? "" : `text-shadow: 0 2px ${Math.round(width * 0.02)}px rgba(0,0,0,0.3);`}
  }

  /* Subtext */
  .subtext {
    font-size: ${h2Size}px;
    font-weight: 400;
    color: rgba(245,245,247,0.7);
    line-height: 1.5;
    margin-bottom: ${Math.round(height * 0.03)}px;
    max-width: 85%;
  }

  /* Metric (stats, sale-promo) */
  .metric {
    font-size: ${metricSize}px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #fff, ${accentColor});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: ${Math.round(height * 0.015)}px;
  }

  .metric-label {
    font-family: 'Space Mono', monospace;
    font-size: ${bodySize}px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${accentColor};
    margin-bottom: ${Math.round(height * 0.03)}px;
  }

  /* CTA bar */
  .cta-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: ${Math.round(width * 0.012)}px;
    padding: ${Math.round(height * 0.02)}px ${Math.round(width * 0.025)}px;
    margin-top: auto;
  }

  .cta-text {
    font-family: 'Space Mono', monospace;
    font-size: ${bodySize}px;
    color: ${accentColor};
    letter-spacing: 0.5px;
    font-weight: 700;
  }

  .arrow {
    font-size: ${h2Size}px;
    color: ${accentColor};
  }

  /* Brand pill */
  .brand-pill {
    font-family: 'Space Mono', monospace;
    font-size: ${smallSize}px;
    letter-spacing: 2px;
    color: rgba(245,245,247,0.5);
    margin-top: auto;
    text-align: right;
  }

  /* Quote */
  .quote-mark {
    font-size: ${Math.round(width * 0.25)}px;
    font-weight: 900;
    line-height: 0.7;
    color: rgba(255,255,255,0.08);
    position: absolute;
    top: ${pad}px;
    left: ${pad}px;
    z-index: 1;
  }

  .quote-text {
    font-size: ${Math.round(width * 0.04)}px;
    font-weight: ${isElegant ? 300 : 500};
    font-style: italic;
    line-height: 1.5;
    margin-bottom: ${Math.round(height * 0.03)}px;
    position: relative;
    z-index: 2;
  }

  .attribution {
    font-family: 'Space Mono', monospace;
    font-size: ${bodySize}px;
    color: ${accentColor};
    text-align: right;
  }

  /* Steps */
  .steps {
    display: flex;
    flex-direction: column;
    gap: ${Math.round(height * 0.02)}px;
    margin: ${Math.round(height * 0.03)}px 0;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: ${Math.round(width * 0.02)}px;
    background: rgba(255,255,255,0.05);
    border-radius: ${Math.round(width * 0.01)}px;
    padding: ${Math.round(height * 0.015)}px ${Math.round(width * 0.02)}px;
  }

  .step-num {
    width: ${Math.round(width * 0.045)}px;
    height: ${Math.round(width * 0.045)}px;
    background: ${accentColor};
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: ${Math.round(width * 0.022)}px;
    flex-shrink: 0;
  }

  .step-text {
    font-size: ${bodySize}px;
    line-height: 1.4;
    color: rgba(245,245,247,0.85);
    padding-top: ${Math.round(width * 0.008)}px;
  }

  /* Before/After split */
  .split {
    display: flex;
    flex: 1;
    gap: 2px;
    margin: ${Math.round(height * 0.02)}px 0;
    border-radius: ${Math.round(width * 0.01)}px;
    overflow: hidden;
  }

  .split-half {
    flex: 1;
    padding: ${Math.round(width * 0.03)}px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .split-half.before {
    background: rgba(0,0,0,0.3);
  }

  .split-half.after {
    background: rgba(255,255,255,0.08);
  }

  .split-label {
    font-family: 'Space Mono', monospace;
    font-size: ${smallSize}px;
    letter-spacing: 3px;
    color: ${accentColor};
    margin-bottom: ${Math.round(height * 0.015)}px;
  }

  .split-text {
    font-size: ${bodySize}px;
    line-height: 1.5;
    color: rgba(245,245,247,0.8);
  }

  .split-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${accentColor};
    color: #fff;
    font-weight: 800;
    font-size: ${smallSize}px;
    writing-mode: vertical-lr;
    padding: 0 ${Math.round(width * 0.008)}px;
    letter-spacing: 2px;
  }

  /* Date badge */
  .date-badge {
    background: ${accentColor};
    color: #fff;
    font-family: 'Space Mono', monospace;
    font-size: ${bodySize}px;
    font-weight: 700;
    padding: ${Math.round(height * 0.015)}px ${Math.round(width * 0.025)}px;
    border-radius: ${Math.round(width * 0.01)}px;
    width: fit-content;
    margin-bottom: ${Math.round(height * 0.025)}px;
    letter-spacing: 1px;
  }

  /* Divider line */
  .divider-line {
    width: ${Math.round(width * 0.08)}px;
    height: 2px;
    background: ${accentColor};
    margin: ${Math.round(height * 0.02)}px 0;
  }

  /* Body text (brand story) */
  .body-text {
    font-size: ${h2Size}px;
    font-weight: 300;
    line-height: 1.7;
    color: rgba(245,245,247,0.75);
    margin-bottom: ${Math.round(height * 0.03)}px;
  }

  .tagline {
    font-family: 'Space Mono', monospace;
    font-size: ${smallSize}px;
    color: ${accentColor};
    letter-spacing: 1px;
    margin-top: auto;
  }

  /* Slide number */
  .slide-num {
    font-size: ${Math.round(width * 0.08)}px;
    font-weight: 900;
    color: rgba(255,255,255,0.08);
    line-height: 1;
    margin-bottom: ${Math.round(height * 0.02)}px;
  }

  /* Carousel dots */
  .dots {
    display: flex;
    gap: ${Math.round(width * 0.01)}px;
    justify-content: center;
    margin-top: auto;
  }

  .dot {
    width: ${Math.round(width * 0.01)}px;
    height: ${Math.round(width * 0.01)}px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
  }

  .dot.active {
    width: ${Math.round(width * 0.04)}px;
    border-radius: ${Math.round(width * 0.005)}px;
    background: ${accentColor};
  }

  ${isMinimal ? `
    .card { background: #fafafa; }
    .grid-bg { display: none; }
    .glow-1, .glow-2 { display: none; }
    h1, .subtext, .quote-text, .step-text, .split-text, .body-text { color: #1a1a2e; }
    .subtext, .body-text { color: #444; }
    .badge { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }
    .cta-bar { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); }
    .step { background: rgba(0,0,0,0.03); }
    .split-half.before { background: rgba(0,0,0,0.04); }
    .split-half.after { background: rgba(0,0,0,0.02); }
    .brand-pill { color: rgba(0,0,0,0.4); }
  ` : ""}

  ${isWarm ? `
    .card { background: linear-gradient(145deg, #2d1b00, #1a0a00); }
    .glow-1 { background: #ff8c42; opacity: 0.2; }
    .glow-2 { background: #ffd166; opacity: 0.15; }
  ` : ""}
</style>
</head>
<body>
  <div class="card">
    <div class="grid-bg"></div>
    <div class="glow-1"></div>
    <div class="glow-2"></div>
    <div class="content">
      ${contentHtml}
    </div>
  </div>
</body>
</html>`;
}

/* ── Render HTML to PNG via Puppeteer ─────────────────────────── */

export async function renderCardToPng(
  spec: CardSpec,
  width: number,
  height: number,
): Promise<Buffer> {
  const html = generateCardHtml(spec, width, height);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    const img = await page.screenshot({
      type: "jpeg",
      quality: 90,
      clip: { x: 0, y: 0, width, height },
    });
    return Buffer.from(img);
  } finally {
    await page.close();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
