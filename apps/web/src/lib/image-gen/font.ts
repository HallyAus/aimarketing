/**
 * Font loading for Satori.
 * Fetches Inter font from Google Fonts CDN. Cached in module scope
 * so it's only fetched once per serverless cold start.
 */

let fontCache: ArrayBuffer | null = null;
let fontBoldCache: ArrayBuffer | null = null;

const INTER_REGULAR_URL =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.woff";
const INTER_BOLD_URL =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.woff";

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`);
  return res.arrayBuffer();
}

export async function getInterFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: string }>
> {
  if (!fontCache) {
    fontCache = await fetchFont(INTER_REGULAR_URL);
  }
  if (!fontBoldCache) {
    fontBoldCache = await fetchFont(INTER_BOLD_URL);
  }

  return [
    { name: "Inter", data: fontCache, weight: 400, style: "normal" },
    { name: "Inter", data: fontBoldCache, weight: 700, style: "normal" },
  ];
}
