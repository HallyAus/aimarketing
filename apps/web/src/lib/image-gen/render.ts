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

/* ── Browser instance (reused across invocations in same Lambda) ─ */

let browserPromise: Promise<any> | null = null;

async function getBrowser() {
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    if (process.env.NODE_ENV === "development") {
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

/* ── Render raw HTML string to JPEG via Puppeteer ─────────────── */

export async function renderHtmlToJpeg(
  html: string,
  width: number,
  height: number,
): Promise<Buffer> {
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
