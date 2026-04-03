export function CtaSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
      <style>{`
        @keyframes ctaGlow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
        }
        .cta-glow {
          animation: ctaGlow 5s ease-in-out infinite;
        }
      `}</style>

      {/* Background glow */}
      <div
        className="cta-glow absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "min(600px, 100vw)",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          Ready to Automate Your{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Marketing?
          </span>
        </h2>
        <p
          className="text-base sm:text-lg mb-10 max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Join teams worldwide. Start free, no credit card required.
        </p>
        <a
          href="#pricing"
          className="inline-block px-10 py-4 text-base font-semibold rounded-xl transition-all"
          style={{
            background: "var(--accent-blue)",
            color: "#fff",
            boxShadow:
              "0 0 40px rgba(59, 130, 246, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)",
          }}
        >
          Get Started for Free
        </a>
        <p
          className="mt-4 text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          No credit card required. Set up in under 5 minutes.
        </p>
      </div>
    </section>
  );
}
