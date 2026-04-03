export interface DesignTheme {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export const DESIGN_THEMES: DesignTheme[] = [
  {
    id: "dark-tech",
    name: "Dark Tech",
    description: "Near-black backgrounds, glow orbs, gradient text, grid overlays, neon accents",
    prompt: `DESIGN SYSTEM — DARK TECH:
- Dark premium aesthetic: backgrounds #0B0B0F, #12121A, #1A1A26
- Google Fonts: DM Sans (body), Sora (headlines, weight 700-800), JetBrains Mono (accents/labels)
- Glowing orb effects: absolute-positioned divs with border-radius:50%, filter:blur(60-100px), opacity 0.2-0.4
- Subtle grid overlay: background-image with linear-gradient lines at 0.04 opacity, 30px spacing
- Gradient text: -webkit-background-clip:text with blue-to-cyan (#0066FF to #00D4FF)
- Monospace badges: letter-spacing 2px, subtle borders rgba(255,255,255,0.15), semi-transparent bg
- CTA: blue #0066FF fills or outline with cyan accents
- Colors: blue #0066FF, cyan #00D4FF, accent #FF6B35, green #00E676, purple #8B5CF6
- Text: #F5F5F7 primary, rgba(245,245,247,0.7) secondary, #7A7A8E muted`,
  },
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    description: "White backgrounds, lots of whitespace, thin borders, muted tones",
    prompt: `DESIGN SYSTEM — CLEAN MINIMAL:
- Light, airy aesthetic: background #FFFFFF, surfaces #F8F9FA, #F1F3F5
- Google Fonts: Inter (body, 400-600), Inter (headlines, weight 700)
- No glow effects, no gradients on backgrounds
- Thin 1px borders: #E9ECEF
- Text colors: #212529 primary, #495057 secondary, #868E96 muted
- Accent: single brand color, used sparingly — #228BE6 (blue) default
- CTA: solid accent color, 6px radius, clean and simple
- Generous whitespace: padding 48-64px, line-height 1.7
- Icons: thin line-style, 1.5px stroke
- Card style: white bg, 1px border, 8px radius, subtle shadow (0 1px 3px rgba(0,0,0,0.04))
- Typography: clean hierarchy, no decorative elements, let the content breathe`,
  },
  {
    id: "bold-pop",
    name: "Bold Pop",
    description: "Vibrant solid colors, chunky text, high contrast, energetic",
    prompt: `DESIGN SYSTEM — BOLD POP:
- Vibrant, high-energy aesthetic: bold solid-color backgrounds
- Google Fonts: Space Grotesk (headlines, weight 700-800), DM Sans (body)
- Background colors: rotate through #FF006E (hot pink), #3A86FF (electric blue), #06D6A0 (mint), #FFB703 (amber), #8338EC (purple)
- NO gradients on backgrounds — use flat, bold color blocks
- Text: white #FFFFFF on dark/vibrant backgrounds, #1A1A2E on light
- Headline style: MASSIVE font-size (8-10% of width), tight letter-spacing (-0.03em), uppercase optional
- Accent shapes: large geometric blocks, thick borders (3-4px), rounded corners (16px)
- CTA: contrasting color pill, bold text, large padding
- Decorative: chunky stripes, dots, zigzags — high opacity (0.3+)
- Overall feel: loud, confident, impossible to ignore in a feed`,
  },
  {
    id: "warm-editorial",
    name: "Warm Editorial",
    description: "Cream tones, serif headlines, elegant spacing, editorial feel",
    prompt: `DESIGN SYSTEM — WARM EDITORIAL:
- Warm, sophisticated aesthetic: backgrounds #FDF8F3, #F5EDE4, #FFFBF5
- Google Fonts: Playfair Display (headlines, weight 700, italic for emphasis), Source Sans 3 (body, 400-600)
- No glow effects — warmth comes from color and typography
- Color palette: warm neutrals #3D2B1F, #5C4033, #8B7355, accents #C17817 (gold), #B85C38 (terracotta)
- Text: #2C1810 primary, #5C4033 secondary, #8B7355 muted
- Thin decorative lines: 1px #D4C4B0 borders, horizontal rules
- Card style: cream bg, subtle warm shadow (0 2px 8px rgba(60,40,20,0.06))
- Typography: large serif headlines with generous line-height (1.3), body text line-height 1.8
- Decorative: thin gold horizontal rules, small leaf/dot ornaments, pull quotes with large serif marks
- CTA: terracotta or gold buttons, rounded 8px, elegant feel
- Overall: feels like a luxury magazine spread`,
  },
  {
    id: "gradient-flow",
    name: "Gradient Flow",
    description: "Rich multi-color gradients, white text, soft blurs, modern feel",
    prompt: `DESIGN SYSTEM — GRADIENT FLOW:
- Modern, flowing aesthetic: rich gradient backgrounds
- Google Fonts: Plus Jakarta Sans (all weights, 400-800)
- Background gradients: multi-stop, 135deg angle. Palettes:
  * Purple flow: #7C3AED → #DB2777 → #F97316
  * Ocean: #0EA5E9 → #6366F1 → #8B5CF6
  * Sunset: #F43F5E → #F97316 → #FBBF24
  * Forest: #059669 → #0D9488 → #06B6D4
- Soft blur overlays: large divs with filter:blur(80px), white at 0.1 opacity for depth
- Text: white #FFFFFF, secondary rgba(255,255,255,0.8)
- Glass-morphism cards: rgba(255,255,255,0.1) bg, backdrop-filter:blur(12px), 1px white border at 0.2 opacity
- CTA: white button with gradient text, or glass-morphism style
- Rounded everything: 16-24px border-radius
- Decorative: floating glass circles, smooth wave shapes via SVG
- Overall: fresh, startup-y, optimistic, Instagram-native`,
  },
  {
    id: "corporate-trust",
    name: "Corporate Trust",
    description: "Navy/charcoal, structured layouts, data-forward, trust badges",
    prompt: `DESIGN SYSTEM — CORPORATE TRUST:
- Professional, trustworthy aesthetic: structured and data-forward
- Google Fonts: IBM Plex Sans (body, 400-600), IBM Plex Sans (headlines, 700)
- Background: #FFFFFF primary, #F8FAFC surfaces, navy #0F172A for dark sections
- Color palette: navy #1E3A5F, steel blue #3B82F6, green #22C55E (positive), slate #64748B
- Borders: #E2E8F0, crisp 1px
- Card style: white bg, 1px border, 8px radius, clean shadow (0 1px 2px rgba(0,0,0,0.05))
- Data elements: stat blocks with large numbers, percentage bars, checkmark lists
- Trust badges: shield icons, certification marks, "Trusted by X+" counters
- CTA: navy or blue buttons, squared-off corners (6px radius), professional copy
- Grid layouts: structured 2-3 column grids, consistent gutters
- Icons: solid fill style, contained in colored circles
- Typography: no decorative fonts, hierarchy through weight and size only
- Overall: you'd trust this company with your money/data`,
  },
  {
    id: "retro-vintage",
    name: "Retro / Vintage",
    description: "Earth tones, textures, rounded shapes, handwritten accents, craft feel",
    prompt: `DESIGN SYSTEM — RETRO VINTAGE:
- Warm, nostalgic aesthetic: craft and artisan feel
- Google Fonts: Archivo Black (headlines), Caveat (handwritten accents), DM Sans (body)
- Background: #F5F0EB (parchment), #E8DFD5 (warm gray), #2C2416 (espresso for dark sections)
- Color palette: #8B4513 (saddle brown), #D4A574 (tan), #C75146 (brick red), #4A7C59 (forest green), #E8B64B (mustard)
- Textured backgrounds: CSS noise pattern using background-image with tiny repeated gradients
- Borders: 2px solid, slightly rounded (12px)
- Stamp/badge elements: circular badges with dashed borders, rotated slightly (transform:rotate(-3deg))
- Typography: headlines in Archivo Black uppercase with letter-spacing 1px, accents in Caveat (handwritten)
- Decorative: small stars, dots, banner ribbons, wavy underlines
- CTA: brick red or forest green, large rounded buttons, bold text
- Overall: feels handmade, authentic, like a craft coffee shop menu or indie brand`,
  },
  {
    id: "neon-night",
    name: "Neon Night",
    description: "Black backgrounds, bright neon outlines, glitch effects, cyberpunk energy",
    prompt: `DESIGN SYSTEM — NEON NIGHT:
- Dark, electric aesthetic: cyberpunk meets nightlife
- Google Fonts: Orbitron (headlines, weight 700-900), Space Mono (body/accents)
- Background: pure black #000000 or near-black #0A0A0A
- Neon colors: #FF00FF (magenta), #00FFFF (cyan), #FFFF00 (yellow), #FF3366 (hot pink), #39FF14 (neon green)
- Text: neon-colored with text-shadow glow effect: text-shadow: 0 0 10px currentColor, 0 0 40px currentColor
- Neon borders: 2px solid with box-shadow glow: box-shadow: 0 0 10px #FF00FF, inset 0 0 10px rgba(255,0,255,0.1)
- Glitch effect: duplicate text with slight offset using ::before/::after (simulate with two positioned spans, offset 2px, different neon colors, mix-blend-mode: screen)
- Scanline overlay: repeating linear-gradient for CRT monitor effect (subtle, 0.03 opacity)
- CTA: neon border outline buttons with glow, transparent bg
- Decorative: horizontal neon lines, flickering dots (CSS animation), circuit-board patterns
- Typography: uppercase Orbitron for headlines, monospace for everything else, wide letter-spacing
- Overall: electric, nocturnal, makes you want to go to a rave`,
  },
];

export function getThemeById(id: string): DesignTheme {
  return DESIGN_THEMES.find((t) => t.id === id) ?? DESIGN_THEMES[0]!;
}
