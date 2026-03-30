"use client";

const testimonials = [
  {
    quote:
      "AdPilot completely transformed how we manage our clients' social media. We went from juggling 6 tools to one dashboard. Our team saves 15+ hours every week.",
    name: "Sarah Mitchell",
    role: "Head of Digital",
    company: "Reef Digital Agency",
    initials: "SM",
    color: "var(--accent-blue)",
  },
  {
    quote:
      "The AI content studio is a game-changer. It understands our brand voice better than most junior copywriters. We've tripled our content output without hiring anyone new.",
    name: "James Chen",
    role: "Marketing Director",
    company: "Harbour Commerce",
    initials: "JC",
    color: "var(--accent-purple)",
  },
  {
    quote:
      "We manage social for 40+ Australian businesses. AdPilot's white-label reports and multi-account management made it possible to scale without the chaos.",
    name: "Emily Oakes",
    role: "Founder & CEO",
    company: "Southern Social Co.",
    initials: "EO",
    color: "var(--accent-emerald)",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4" style={{ background: "var(--bg-primary)" }}>
      <style>{`
        .testimonial-card {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .testimonial-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-purple-muted)",
              color: "var(--accent-purple)",
            }}
          >
            Testimonials
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Trusted by Agencies Across{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Australia
            </span>
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="testimonial-card relative rounded-2xl p-6 lg:p-8"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Quote mark */}
              <div
                className="text-4xl font-serif leading-none mb-4"
                style={{ color: "var(--border-primary)", opacity: 0.5 }}
              >
                &ldquo;
              </div>

              {/* Quote text */}
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                {t.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                  style={{
                    background: `${t.color}20`,
                    color: t.color,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
