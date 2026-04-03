export type TemplateName =
  | "product-showcase"
  | "announcement"
  | "sale-promo"
  | "testimonial"
  | "stats"
  | "tips-howto"
  | "before-after"
  | "event-launch"
  | "brand-story"
  | "carousel-card";

export type Mood = "bold" | "elegant" | "playful" | "minimal" | "warm";

export interface CardSpec {
  template: TemplateName;

  // Content
  headline: string;
  subtext?: string;
  cta?: string;
  metric?: string;
  metricLabel?: string;
  steps?: string[];
  quote?: string;
  attribution?: string;
  beforeText?: string;
  afterText?: string;
  eventDate?: string;

  // Visual
  palette: [string, string];
  accentColor: string;
  mood: Mood;

  // Brand
  brandName?: string;
  brandTagline?: string;
}

export interface TemplateProps {
  spec: CardSpec;
  width: number;
  height: number;
}
