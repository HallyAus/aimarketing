const steps = [
  {
    number: "01",
    title: "Connect",
    description:
      "Link your social accounts with one-click OAuth. Facebook, Instagram, TikTok, LinkedIn, and more — connected in seconds.",
    icon: "🔌",
  },
  {
    number: "02",
    title: "Create",
    description:
      "Use AI to generate on-brand content or bring your own. Our Claude-powered studio writes, edits, and designs for you.",
    icon: "✨",
  },
  {
    number: "03",
    title: "Automate",
    description:
      "Schedule, publish, and analyze — all on autopilot. Your timezone is auto-detected; your team sees their local time. Set it once and let ReachPilot handle the rest.",
    icon: "🚀",
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-24 px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-emerald-muted)",
              color: "var(--accent-emerald)",
            }}
          >
            How It Works
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Up and Running in{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-emerald), var(--accent-blue))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              3 Steps
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-12 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 5%, var(--border-primary) 20%, var(--border-primary) 80%, transparent 95%)",
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {/* Mobile connecting line */}
                {i < steps.length - 1 && (
                  <div
                    className="md:hidden absolute left-1/2 top-24 w-px h-12 -translate-x-1/2"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--border-primary), transparent)",
                    }}
                  />
                )}

                {/* Step number circle */}
                <div className="flex justify-center mb-6">
                  <div
                    className="relative flex items-center justify-center w-24 h-24 rounded-2xl"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    <span className="text-3xl">{step.icon}</span>
                    <span
                      className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                      style={{
                        background: "var(--accent-blue)",
                        color: "#fff",
                        boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
                      }}
                    >
                      {step.number.replace("0", "")}
                    </span>
                  </div>
                </div>

                {/* Text */}
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed max-w-xs mx-auto"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
