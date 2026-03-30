const platformIcons = [
  { name: "Facebook", emoji: "f", x: "10%", y: "20%", delay: "0s" },
  { name: "Instagram", emoji: "ig", x: "85%", y: "15%", delay: "0.5s" },
  { name: "TikTok", emoji: "tt", x: "5%", y: "65%", delay: "1s" },
  { name: "LinkedIn", emoji: "in", x: "90%", y: "60%", delay: "1.5s" },
  { name: "YouTube", emoji: "yt", x: "15%", y: "80%", delay: "2s" },
  { name: "Twitter", emoji: "x", x: "80%", y: "80%", delay: "0.3s" },
  { name: "Google", emoji: "g", x: "25%", y: "10%", delay: "0.8s" },
  { name: "Pinterest", emoji: "p", x: "70%", y: "10%", delay: "1.2s" },
  { name: "Snapchat", emoji: "sc", x: "92%", y: "35%", delay: "1.8s" },
];

const stats = [
  { label: "9 Platforms", icon: "🌐" },
  { label: "AI-Powered", icon: "🤖" },
  { label: "Set Up in 5 Min", icon: "⚡" },
  { label: "Free to Start", icon: "🎯" },
];

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16"
      style={{ background: "var(--bg-primary)" }}
    >
      <style>{`
        @keyframes heroOrbPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.6;
          }
        }
        @keyframes heroOrbRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-orb {
          animation: heroOrbPulse 6s ease-in-out infinite;
        }
        .hero-orb-ring {
          animation: heroOrbRotate 20s linear infinite;
        }
        .hero-float {
          animation: heroFloat 4s ease-in-out infinite;
        }
        .hero-fade-up {
          animation: heroFadeUp 0.8s ease-out both;
        }
        .hero-fade-up-delay-1 { animation-delay: 0.1s; }
        .hero-fade-up-delay-2 { animation-delay: 0.25s; }
        .hero-fade-up-delay-3 { animation-delay: 0.4s; }
        .hero-fade-up-delay-4 { animation-delay: 0.55s; }
        .hero-fade-up-delay-5 { animation-delay: 0.7s; }
      `}</style>

      {/* Background orb */}
      <div
        className="hero-orb absolute pointer-events-none"
        style={{
          top: "40%",
          left: "50%",
          width: "min(700px, 90vw)",
          height: "min(700px, 90vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Secondary orb ring */}
      <div
        className="hero-orb-ring absolute pointer-events-none"
        style={{
          top: "40%",
          left: "50%",
          width: "min(500px, 70vw)",
          height: "min(500px, 70vw)",
          borderRadius: "50%",
          border: "1px solid rgba(59, 130, 246, 0.1)",
        }}
      />

      {/* Floating platform icons */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {platformIcons.map((p) => (
          <div
            key={p.name}
            className="hero-float absolute"
            style={{
              left: p.x,
              top: p.y,
              animationDelay: p.delay,
              animationDuration: `${3.5 + Math.random() * 2}s`,
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold uppercase"
              style={{
                background: "rgba(26, 26, 38, 0.8)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-tertiary)",
                backdropFilter: "blur(8px)",
              }}
            >
              {p.emoji}
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="hero-fade-up hero-fade-up-delay-1">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full mb-8"
            style={{
              background: "var(--accent-blue-muted)",
              color: "var(--accent-blue)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--accent-emerald)" }}
            />
            Now in public beta
          </span>
        </div>

        {/* Headline */}
        <h1
          className="hero-fade-up hero-fade-up-delay-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          Your AI Marketing Team,{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 50%, var(--accent-blue) 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Always On
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-fade-up hero-fade-up-delay-3 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Automate your marketing across Facebook, Instagram, TikTok, LinkedIn,
          Twitter, YouTube, Google Ads, Pinterest, and Snapchat — powered by AI
          that learns your brand voice.
        </p>

        {/* CTAs */}
        <div className="hero-fade-up hero-fade-up-delay-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href="#pricing"
            className="px-8 py-3.5 text-base font-semibold rounded-xl transition-all"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
              boxShadow:
                "0 0 30px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            Start Free
          </a>
          <a
            href="#demo"
            className="px-8 py-3.5 text-base font-semibold rounded-xl transition-all"
            style={{
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            Watch Demo
          </a>
        </div>

        {/* Trust signal */}
        <p
          className="hero-fade-up hero-fade-up-delay-4 text-sm mb-10"
          style={{ color: "var(--text-tertiary)" }}
        >
          Trusted by 500+ Australian businesses
        </p>

        {/* Stats bar */}
        <div
          className="hero-fade-up hero-fade-up-delay-5 inline-flex flex-wrap items-center justify-center gap-0 rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 px-5 sm:px-8 py-4"
              style={{
                borderRight:
                  i < stats.length - 1
                    ? "1px solid var(--border-secondary)"
                    : "none",
              }}
            >
              <span className="text-lg">{stat.icon}</span>
              <span
                className="text-sm font-medium whitespace-nowrap"
                style={{ color: "var(--text-secondary)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
