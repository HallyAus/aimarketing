"use client";

const platforms = [
  {
    name: "Facebook",
    capability: "Pages, Groups, Ads",
    color: "#1877F2",
    letter: "f",
  },
  {
    name: "Instagram",
    capability: "Feed, Stories, Reels",
    color: "#E4405F",
    letter: "ig",
  },
  {
    name: "TikTok",
    capability: "Videos, Ads, Analytics",
    color: "#00F2EA",
    letter: "tt",
  },
  {
    name: "LinkedIn",
    capability: "Posts, Articles, Ads",
    color: "#0A66C2",
    letter: "in",
  },
  {
    name: "Twitter / X",
    capability: "Tweets, Threads, Spaces",
    color: "#E8E8ED",
    letter: "x",
  },
  {
    name: "YouTube",
    capability: "Videos, Shorts, Community",
    color: "#FF0000",
    letter: "yt",
  },
  {
    name: "Google Ads",
    capability: "Search, Display, Video",
    color: "#4285F4",
    letter: "g",
  },
  {
    name: "Pinterest",
    capability: "Pins, Boards, Ads",
    color: "#BD081C",
    letter: "p",
  },
  {
    name: "Snapchat",
    capability: "Ads, Stories, Lenses",
    color: "#FFFC00",
    letter: "sc",
  },
];

export function PlatformShowcase() {
  return (
    <section id="platforms" className="py-24 px-4 relative overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
      <style>{`
        @keyframes platformPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes platformOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .platform-card {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .platform-card:hover {
          transform: translateY(-6px);
        }
      `}</style>

      {/* Background orbital ring */}
      <div
        className="absolute pointer-events-none hidden lg:block"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          border: "1px solid var(--border-secondary)",
          opacity: 0.3,
        }}
      />
      <div
        className="absolute pointer-events-none hidden lg:block"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          border: "1px solid var(--border-secondary)",
          opacity: 0.2,
        }}
      />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-4"
            style={{
              background: "var(--accent-purple-muted)",
              color: "var(--accent-purple)",
            }}
          >
            Platforms
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            One Dashboard.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Every Platform.
            </span>
          </h2>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Connect all your social accounts and manage everything from a single, powerful interface.
          </p>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="platform-card flex items-center gap-4 p-5 rounded-xl"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = platform.color;
                e.currentTarget.style.boxShadow = `0 0 25px ${platform.color}20, 0 0 4px ${platform.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Platform icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl text-sm font-bold uppercase"
                style={{
                  background: `${platform.color}18`,
                  color: platform.color,
                  border: `1px solid ${platform.color}30`,
                }}
              >
                {platform.letter}
              </div>
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {platform.name}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {platform.capability}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
